import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;

import 'dart:convert';
import 'dart:typed_data';
import 'package:uuid/uuid.dart';
import '../app_theme.dart';
import '../providers/api_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/dashboard_provider.dart';
import '../providers/visits_provider.dart';
import '../../data/api_repository.dart';

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
        // Fall back to lat/lng
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



  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: context.isDarkMode ? AppTheme.darkTheme : AppTheme.lightTheme,
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
        SnackBar(
          content: const Text('GPS Location is required.'),
          backgroundColor: AppTheme.dangerRed,
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
          SnackBar(
            content: const Text('Visit saved successfully'),
            backgroundColor: AppTheme.successGreen,
          ),
        );
        ref.invalidate(dashboardProvider);
        ref.invalidate(visitsProvider);
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit: $e'), backgroundColor: AppTheme.dangerRed),
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
        title: Text('Record Visit', style: AppTheme.headingSmall.copyWith(color: context.textPrimaryColor)),
        centerTitle: false,
        backgroundColor: context.surfaceColor,
        elevation: 0,
        actions: [
          if (_isSubmitting)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 24, height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else
            TextButton(
              onPressed: _submit,
              child: Text('SAVE', style: AppTheme.buttonText.copyWith(color: AppTheme.primaryBlue)),
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            // ─── 1. Site Information ──────────────────────────────────────────
            _buildSectionTitle('1. Where are you?'),
            TextFormField(
              controller: _siteNameController,
              decoration: AppTheme.inputDecoration(
                label: 'Customer / Site Name',
                icon: Icons.business_rounded,
                context: context,
              ),
              style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
              validator: (val) => (val == null || val.trim().isEmpty) ? 'Required' : null,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            
            // Location Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _currentPosition != null ? AppTheme.successGreen.withValues(alpha: 0.1) : context.surfaceColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _currentPosition != null ? AppTheme.successGreen.withValues(alpha: 0.3) : context.borderSubtleColor,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    _currentPosition != null ? Icons.check_circle : Icons.location_on_outlined,
                    color: _currentPosition != null ? AppTheme.successGreen : context.textSecondaryColor,
                    size: 28,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _currentPosition != null ? 'Location Captured' : 'Location Required',
                          style: AppTheme.bodyLarge.copyWith(
                            fontWeight: FontWeight.w600,
                            color: _currentPosition != null ? AppTheme.successGreen : context.textPrimaryColor,
                          ),
                        ),
                        if (_addressText != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            _addressText!,
                            style: AppTheme.bodySmall.copyWith(color: context.textSecondaryColor),
                          ),
                        ]
                      ],
                    ),
                  ),
                  if (_currentPosition == null)
                    ElevatedButton(
                      onPressed: _isGettingLocation ? null : _getLocation,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.textPrimaryColor,
                        foregroundColor: context.surfaceColor,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: _isGettingLocation
                          ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: context.surfaceColor, strokeWidth: 2))
                          : const Text('Capture'),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // ─── 2. Photo Evidence ────────────────────────────────────────────
            _buildSectionTitle('2. Site Photo'),
            GestureDetector(
              onTap: _isUploadingImage ? null : _pickImage,
              child: Container(
                height: 160,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: context.surfaceColor,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: context.borderSubtleColor),
                ),
                child: _isUploadingImage
                    ? const Center(child: CircularProgressIndicator())
                    : _imageBytes != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                Image.memory(_imageBytes!, fit: BoxFit.cover),
                                Positioned(
                                  bottom: 8, right: 8,
                                  child: CircleAvatar(
                                    backgroundColor: Colors.black54,
                                    child: Icon(Icons.edit, color: Colors.white, size: 20),
                                  ),
                                ),
                              ],
                            ),
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.add_a_photo_outlined, color: context.textSecondaryColor, size: 40),
                              const SizedBox(height: 12),
                              Text('Tap to take photo', style: AppTheme.bodyMedium.copyWith(color: context.textSecondaryColor)),
                            ],
                          ),
              ),
            ),
            const SizedBox(height: 32),

            // ─── 3. Visit Notes ───────────────────────────────────────────────
            _buildSectionTitle('3. Visit Details'),
            TextFormField(
              controller: _notesController,
              decoration: AppTheme.inputDecoration(
                label: 'Discussion / Notes',
                context: context,
              ),
              style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
              maxLines: 4,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 32),

            // ─── 4. Follow Up ────────────────────────────────────────────────
            _buildSectionTitle('4. Next Action'),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.surfaceColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: context.borderSubtleColor),
              ),
              child: Column(
                children: [
                  TextFormField(
                    controller: _followUpDateController,
                    readOnly: true,
                    onTap: _selectDate,
                    decoration: AppTheme.inputDecoration(
                      label: 'Follow-up Date',
                      icon: Icons.calendar_today_rounded,
                      context: context,
                    ),
                    style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _followUpNotesController,
                    decoration: AppTheme.inputDecoration(
                      label: 'Follow-up Task',
                      context: context,
                    ),
                    style: AppTheme.bodyLarge.copyWith(color: context.textPrimaryColor),
                    maxLines: 2,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 48),

            // ─── Submit Button ────────────────────────────────────────────────
            ElevatedButton(
              onPressed: _isSubmitting || _isUploadingImage ? null : _submit,
              style: AppTheme.primaryButton,
              child: _isSubmitting
                  ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('SAVE VISIT RECORD'),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(
        title,
        style: AppTheme.headingSmall.copyWith(color: context.textPrimaryColor),
      ),
    );
  }
}

class _ManualMaterialEntry {
  final TextEditingController nameController = TextEditingController();
  final TextEditingController quantityController = TextEditingController();
}
