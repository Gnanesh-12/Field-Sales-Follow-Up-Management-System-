import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'dart:convert';
import 'dart:typed_data';
import 'package:uuid/uuid.dart';
import '../app_theme.dart';
import '../providers/reference_data_provider.dart';
import '../providers/api_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/dashboard_provider.dart';
import '../providers/visits_provider.dart';
import '../../data/api_repository.dart';
import '../../data/models/models.dart';

class NewVisitPage extends ConsumerStatefulWidget {
  const NewVisitPage({super.key});

  @override
  ConsumerState<NewVisitPage> createState() => _NewVisitPageState();
}

class _NewVisitPageState extends ConsumerState<NewVisitPage> {
  final _formKey = GlobalKey<FormState>();
  final _recordId = const Uuid().v4();
  
  final _siteNameController = TextEditingController();
  Position? _currentPosition;
  String? _addressText;
  bool _isGettingLocation = false;
  
  XFile? _imageFile;
  Uint8List? _imageBytes; // For web display
  bool _isUploadingImage = false;
  String? _uploadedImageUrl;

  final List<_ManualMaterialEntry> _materials = [];
  
  final _followUpDateController = TextEditingController();
  final _followUpNotesController = TextEditingController();
  final _notesController = TextEditingController();
  final _remarksController = TextEditingController();
  
  bool _isSubmitting = false;

  @override
  void dispose() {
    _siteNameController.dispose();
    _followUpDateController.dispose();
    _followUpNotesController.dispose();
    _notesController.dispose();
    _remarksController.dispose();
    super.dispose();
  }

  Future<void> _getLocation() async {
    setState(() => _isGettingLocation = true);
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permissions are denied');
        }
      }
      
      if (permission == LocationPermission.deniedForever) {
        throw Exception('Location permissions are permanently denied');
      } 

      final position = await Geolocator.getCurrentPosition();
      
      // Reverse geocode to get full address
      String address = '${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}';
      try {
        final url = Uri.parse(
          'https://nominatim.openstreetmap.org/reverse?lat=${position.latitude}&lon=${position.longitude}&format=json&addressdetails=1',
        );
        final response = await http.get(url, headers: {'User-Agent': 'FieldSalesApp/1.0'});
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          if (data['display_name'] != null) {
            address = data['display_name'];
          }
        }
      } catch (_) {
        // Fall back to lat/lng if reverse geocoding fails
      }
      
      setState(() {
        _currentPosition = position;
        _addressText = address;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error getting location: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isGettingLocation = false);
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.camera, imageQuality: 70);
    
    if (pickedFile != null) {
      final bytes = await pickedFile.readAsBytes();
      setState(() {
        _imageFile = pickedFile;
        _imageBytes = bytes;
      });
      _uploadImage(pickedFile, bytes);
    }
  }
  
  Future<void> _uploadImage(XFile file, Uint8List bytes) async {
    setState(() => _isUploadingImage = true);
    try {
      final secureStorage = ref.read(secureStorageProvider);
      final token = await secureStorage.read(key: 'jwt_token');
      
      final uri = Uri.parse('$baseUrl/uploads/image');
      final request = http.MultipartRequest('POST', uri)
        ..headers['Authorization'] = 'Bearer $token'
        ..fields['recordId'] = _recordId
        ..files.add(http.MultipartFile.fromBytes(
          'file',
          bytes,
          filename: file.name,
          contentType: MediaType('image', 'jpeg'),
        ));
        
      final response = await request.send();
      if (response.statusCode == 201 || response.statusCode == 200) {
        final responseData = await response.stream.bytesToString();
        final data = jsonDecode(responseData);
        setState(() {
          _uploadedImageUrl = data['url'];
        });
      } else {
        throw Exception('Upload failed with status ${response.statusCode}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error uploading image: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploadingImage = false);
    }
  }

  void _addMaterial() {
    setState(() {
      _materials.add(_ManualMaterialEntry());
    });
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        return Theme(
          data: isDark
              ? ThemeData.dark().copyWith(
                  colorScheme: const ColorScheme.dark(
                    primary: AppTheme.accentCoral,
                    onPrimary: Colors.white,
                    surface: AppTheme.surfaceDark,
                    onSurface: AppTheme.textPrimary,
                  ),
                )
              : ThemeData.light().copyWith(
                  colorScheme: const ColorScheme.light(
                    primary: AppTheme.accentCoral,
                    onPrimary: Colors.white,
                    surface: AppTheme.surfaceLight,
                    onSurface: AppTheme.textPrimaryLight,
                  ),
                ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _followUpDateController.text = DateFormat('yyyy-MM-dd').format(picked);
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_siteNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a customer site name')),
      );
      return;
    }

    if (_currentPosition == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('GPS Location is required. Please capture your location first.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final repository = ref.read(apiRepositoryProvider);
      
      Map<String, dynamic>? followUpData;
      if (_followUpDateController.text.isNotEmpty) {
        followUpData = {
          'dueDate': _followUpDateController.text,
          'notes': _followUpNotesController.text,
        };
      }

      final materialsData = _materials
          .where((m) => m.nameController.text.trim().isNotEmpty && m.quantityController.text.isNotEmpty)
          .map((m) => {
                'materialName': m.nameController.text.trim(),
                'quantity': double.tryParse(m.quantityController.text) ?? 0,
              })
          .toList();

      await repository.createVisit({
        'id': _recordId,
        'customerSiteName': _siteNameController.text.trim(),
        'notes': _notesController.text,
        'remarks': _remarksController.text,
        'lat': _currentPosition?.latitude,
        'lng': _currentPosition?.longitude,
        'accuracy': _currentPosition?.accuracy,
        'imageUrl': _uploadedImageUrl,
        'materials': materialsData.isNotEmpty ? materialsData : null,
        'followUp': followUpData,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Field visit logged successfully!')),
        );
        ref.invalidate(dashboardProvider);
        ref.invalidate(visitsProvider);
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        backgroundColor: context.surfaceColor,
        title: Text('New Field Entry', style: AppTheme.headingSmall.copyWith(color: context.textPrimaryColor)),
        centerTitle: true,
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // ─── Customer Site ─────────────────────────────────────
            _buildSectionHeader(Icons.store_rounded, 'Customer Site'),
            TextFormField(
              controller: _siteNameController,
              decoration: AppTheme.inputDecoration(label: 'Enter Site Name', context: context),
              style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
              validator: (val) => (val == null || val.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 24),

            // ─── GPS Location ──────────────────────────────────────
            _buildSectionHeader(Icons.location_on_rounded, 'Location Check-in'),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.surfaceColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.borderSubtleColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        _currentPosition != null ? Icons.check_circle_rounded : Icons.location_searching_rounded,
                        color: _currentPosition != null ? AppTheme.accentGreen : context.textMutedColor,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _currentPosition != null
                              ? _addressText ?? 'Location captured'
                              : 'Location not captured',
                          style: AppTheme.bodyMedium.copyWith(color: context.textSecondaryColor),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      TextButton(
                        onPressed: _isGettingLocation ? null : _getLocation,
                        child: _isGettingLocation
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Text('Capture', style: TextStyle(color: AppTheme.accentTeal)),
                      ),
                    ],
                  ),
                  if (_currentPosition != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      '${_currentPosition!.latitude.toStringAsFixed(4)}, ${_currentPosition!.longitude.toStringAsFixed(4)}',
                      style: AppTheme.bodySmall.copyWith(color: context.textMutedColor),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),

            // ─── Site Image ────────────────────────────────────────
            _buildSectionHeader(Icons.camera_alt_rounded, 'Site Image'),
            GestureDetector(
              onTap: _isUploadingImage ? null : _pickImage,
              child: Container(
                height: 120,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: context.surfaceColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: context.borderSubtleColor),
                ),
                child: _isUploadingImage
                    ? const Center(child: CircularProgressIndicator())
                    : _imageBytes != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.memory(_imageBytes!, fit: BoxFit.cover),
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.add_a_photo_rounded, color: context.textMutedColor, size: 32),
                              const SizedBox(height: 8),
                              Text('Tap to capture photo', style: AppTheme.bodySmall.copyWith(color: context.textMutedColor)),
                            ],
                          ),
              ),
            ),
            const SizedBox(height: 24),

            // ─── Materials ─────────────────────────────────────────
            _buildSectionHeader(Icons.inventory_2_rounded, 'Materials Supplied'),
            ..._materials.map((m) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: TextFormField(
                      controller: m.nameController,
                      decoration: AppTheme.inputDecoration(label: 'Material Name', context: context),
                      style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      controller: m.quantityController,
                      keyboardType: TextInputType.number,
                      decoration: AppTheme.inputDecoration(label: 'Qty', context: context),
                      style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.remove_circle_outline, color: AppTheme.accentPink),
                    onPressed: () => setState(() => _materials.remove(m)),
                  ),
                ],
              ),
            )),
            GestureDetector(
              onTap: _addMaterial,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: context.surfaceColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: context.borderSubtleColor, style: BorderStyle.solid),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add_rounded, color: AppTheme.accentTeal, size: 20),
                    const SizedBox(width: 8),
                    Text('Add Material', style: AppTheme.bodyMedium.copyWith(color: AppTheme.accentTeal, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // ─── Follow-up ─────────────────────────────────────────
            _buildSectionHeader(Icons.event_rounded, 'Next Follow-up (Optional)'),
            TextFormField(
              controller: _followUpDateController,
              readOnly: true,
              onTap: _selectDate,
              decoration: AppTheme.inputDecoration(
                label: 'Due Date',
                icon: Icons.calendar_today_rounded,
                context: context,
              ),
              style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _followUpNotesController,
              decoration: AppTheme.inputDecoration(label: 'Follow-up Notes', context: context),
              style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
              maxLines: 2,
            ),
            const SizedBox(height: 24),

            // ─── Remarks ───────────────────────────────────────────
            _buildSectionHeader(Icons.notes_rounded, 'Visit Remarks'),
            TextFormField(
              controller: _remarksController,
              decoration: AppTheme.inputDecoration(label: 'General remarks or notes', context: context),
              style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
              maxLines: 3,
            ),
            const SizedBox(height: 32),

            // ─── Submit ────────────────────────────────────────────
            SizedBox(
              height: 54,
              child: ElevatedButton(
                onPressed: _isSubmitting || _isUploadingImage ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.accentCoral,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isSubmitting
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('SUBMIT ENTRY', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(IconData icon, String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.accentTeal, size: 20),
          const SizedBox(width: 8),
          Text(title, style: AppTheme.bodyLarge.copyWith(fontWeight: FontWeight.w600, color: AppTheme.accentTeal)),
        ],
      ),
    );
  }
}

class _ManualMaterialEntry {
  final TextEditingController nameController = TextEditingController();
  final TextEditingController quantityController = TextEditingController();
}
