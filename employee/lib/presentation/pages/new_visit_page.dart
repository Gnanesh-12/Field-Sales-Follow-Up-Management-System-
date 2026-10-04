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
import '../providers/api_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/dashboard_provider.dart';
import '../providers/visits_provider.dart';

import '../../data/api_repository.dart';

class NewVisitPage extends ConsumerStatefulWidget {
  const NewVisitPage({super.key});

  @override
  ConsumerState<NewVisitPage> createState() =>
      _NewVisitPageState();
}

class _NewVisitPageState
    extends ConsumerState<NewVisitPage> {
  final _formKey =
      GlobalKey<FormState>();

  final _recordId =
      const Uuid().v4();

  final _siteNameController =
      TextEditingController();

  final _customerEmailController =
      TextEditingController();

  Position? _currentPosition;

  String? _addressText;

  bool _isGettingLocation =
      false;

  final List<_PhotoEntry> _photos =
      [];

  bool get _isUploadingImage =>
      _photos.any(
        (p) => p.uploading,
      );

  final List<
      _ManualMaterialEntry> _materials =
      [];

  final _followUpDateController =
      TextEditingController();

  final _followUpNotesController =
      TextEditingController();

  final _notesController =
      TextEditingController();

  final _remarksController =
      TextEditingController();

  bool _sendToCustomer = false;

  bool _isSubmitting = false;

  @override
  void dispose() {
    _siteNameController.dispose();
    _customerEmailController.dispose();
    _followUpDateController.dispose();
    _followUpNotesController.dispose();
    _notesController.dispose();
    _remarksController.dispose();
    super.dispose();
  }

  Future<void> _getLocation() async {
    setState(
      () => _isGettingLocation = true,
    );

    try {
      LocationPermission permission =
          await Geolocator.checkPermission();

      if (permission ==
          LocationPermission.denied) {
        permission =
            await Geolocator.requestPermission();

        if (permission ==
            LocationPermission.denied) {
          throw Exception(
            'Location permissions are denied',
          );
        }
      }

      if (permission ==
          LocationPermission.deniedForever) {
        throw Exception(
          'Location permissions are permanently denied',
        );
      }

      final position =
          await Geolocator.getCurrentPosition();

      String address =
          '${position.latitude.toStringAsFixed(4)}, '
          '${position.longitude.toStringAsFixed(4)}';

      try {
        final url = Uri.parse(
          'https://nominatim.openstreetmap.org/reverse'
          '?lat=${position.latitude}'
          '&lon=${position.longitude}'
          '&format=json'
          '&addressdetails=1',
        );

        final response =
            await http.get(
          url,
          headers: {
            'User-Agent':
                'FieldSalesApp/1.0',
          },
        );

        if (response.statusCode ==
            200) {
          final data =
              jsonDecode(
            response.body,
          );

          if (data['display_name'] !=
              null) {
            address =
                data['display_name'];
          }
        }
      } catch (_) {
        // Keep latitude/longitude fallback.
      }

      setState(() {
        _currentPosition =
            position;

        _addressText =
            address;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(
          SnackBar(
            content: Text(
              'Error getting location: $e',
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(
          () => _isGettingLocation =
              false,
        );
      }
    }
  }

  Future<void> _pickImage() async {
    final picker =
        ImagePicker();

    final pickedFile =
        await picker.pickImage(
      source:
          ImageSource.camera,
      imageQuality: 70,
    );

    if (pickedFile != null) {
      final bytes =
          await pickedFile.readAsBytes();

      final entry =
          _PhotoEntry(
        bytes: bytes,
      );

      setState(() {
        _photos.add(entry);
      });

      _uploadImage(
        pickedFile,
        entry,
      );
    }
  }

  void _removePhotoAt(
    int index,
  ) {
    setState(() {
      _photos.removeAt(index);
    });
  }

  Future<void> _uploadImage(
    XFile file,
    _PhotoEntry entry,
  ) async {
    try {
      final secureStorage =
          ref.read(
        secureStorageProvider,
      );

      final token =
          await secureStorage.read(
        key: 'jwt_token',
      );

      final uri =
          Uri.parse(
        '$baseUrl/uploads/image',
      );

      final request =
          http.MultipartRequest(
        'POST',
        uri,
      )
            ..headers[
                    'Authorization'] =
                'Bearer $token'
            ..fields[
                    'recordId'] =
                _recordId
            ..files.add(
              http.MultipartFile.fromBytes(
                'file',
                entry.bytes,
                filename:
                    file.name,
                contentType:
                    MediaType.parse(
                  file.mimeType ??
                      'image/jpeg',
                ),
              ),
            );

      final response =
          await request.send();

      if (response.statusCode ==
              201 ||
          response.statusCode ==
              200) {
        final responseData =
            await response.stream
                .bytesToString();

        final data =
            jsonDecode(
          responseData,
        );

        setState(() {
          entry.url =
              data['url'];

          entry.uploading =
              false;
        });
      } else {
        throw Exception(
          'Upload failed with status ${response.statusCode}',
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          entry.uploading =
              false;
        });

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(
          SnackBar(
            content: Text(
              'Error uploading image: $e',
            ),
          ),
        );
      }
    }
  }

  Future<void> _selectDate() async {
    final picked =
        await showDatePicker(
      context: context,
      initialDate:
          DateTime.now().add(
        const Duration(
          days: 1,
        ),
      ),
      firstDate:
          DateTime.now(),
      lastDate:
          DateTime.now().add(
        const Duration(
          days: 365,
        ),
      ),
      builder:
          (context, child) {
        return Theme(
          data:
              context.isDarkMode
                  ? AppTheme.darkTheme
                  : AppTheme.lightTheme,
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _followUpDateController
                .text =
            DateFormat(
          'yyyy-MM-dd',
        ).format(picked);
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!
        .validate()) {
      return;
    }

    if (_siteNameController.text
        .trim()
        .isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(
        const SnackBar(
          content: Text(
            'Please enter a customer site name',
          ),
        ),
      );

      return;
    }

    if (_currentPosition == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(
        SnackBar(
          content: const Text(
            'GPS Location is required.',
          ),
          backgroundColor:
              AppTheme.dangerRed,
        ),
      );

      return;
    }

    if (_sendToCustomer) {
      final email =
          _customerEmailController
              .text
              .trim();

      if (email.isEmpty) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(
          const SnackBar(
            content: Text(
              'Please enter the customer email address.',
            ),
          ),
        );

        return;
      }

      final emailRegex =
          RegExp(
        r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
      );

      if (!emailRegex.hasMatch(
        email,
      )) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(
          const SnackBar(
            content: Text(
              'Please enter a valid customer email address.',
            ),
          ),
        );

        return;
      }
    }

    setState(
      () => _isSubmitting = true,
    );

    try {
      final repository =
          ref.read(
        apiRepositoryProvider,
      );

      Map<String, dynamic>?
          followUpData;

      if (_followUpDateController
          .text
          .isNotEmpty) {
        followUpData = {
          'dueDate':
              _followUpDateController
                  .text,
          'notes':
              _followUpNotesController
                  .text,
        };
      }

      final materialsData =
          _materials
              .where(
                (m) =>
                    m.nameController
                        .text
                        .trim()
                        .isNotEmpty &&
                    m.quantityController
                        .text
                        .isNotEmpty,
              )
              .map(
                (m) => {
                  'materialName':
                      m.nameController
                          .text
                          .trim(),
                  'quantity':
                      double.tryParse(
                            m.quantityController
                                .text,
                          ) ??
                          0,
                },
              )
              .toList();

      final imageUrls =
          _photos
              .map(
                (p) => p.url,
              )
              .whereType<String>()
              .toList();

      final response =
          await repository.createVisit({
        'id':
            _recordId,

        'customerSiteName':
            _siteNameController
                .text
                .trim(),

        'notes':
            _notesController
                .text,

        'remarks':
            _remarksController
                .text,

        'lat':
            _currentPosition
                ?.latitude,

        'lng':
            _currentPosition
                ?.longitude,

        'accuracy':
            _currentPosition
                ?.accuracy,

        'imageUrls':
            imageUrls.isNotEmpty
                ? imageUrls
                : null,

        'materials':
            materialsData
                    .isNotEmpty
                ? materialsData
                : null,

        'followUp':
            followUpData,

        /*
         * NEW OPTIONAL CUSTOMER COPY
         */
        'sendToCustomer':
            _sendToCustomer,

        if (_sendToCustomer)
          'customerEmail':
              _customerEmailController
                  .text
                  .trim(),
      });

      if (!mounted) {
        return;
      }

      final dynamic responseData = response;
      final customerEmailResult =
          responseData is Map
              ? responseData[
                  'customerEmail']
              : null;

      final customerEmailAttempted =
          customerEmailResult
                  is Map &&
              customerEmailResult[
                      'attempted'] ==
                  true;

      final customerEmailSuccess =
          customerEmailResult
                  is Map &&
              customerEmailResult[
                      'success'] ==
                  true;

      if (_sendToCustomer &&
          customerEmailAttempted &&
          !customerEmailSuccess) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(
          SnackBar(
            content: const Text(
              'Visit saved to Admin, but the customer email could not be sent.',
            ),
            backgroundColor:
                AppTheme.dangerRed,
          ),
        );
      } else if (_sendToCustomer &&
          customerEmailSuccess) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(
          const SnackBar(
            content: Text(
              'Visit saved and a copy was sent to the customer.',
            ),
            backgroundColor:
                AppTheme.successGreen,
          ),
        );
      } else {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(
          const SnackBar(
            content: Text(
              'Visit saved successfully',
            ),
            backgroundColor:
                AppTheme.successGreen,
          ),
        );
      }

      ref.invalidate(
        dashboardProvider,
      );

      ref.invalidate(
        visitsProvider,
      );

      if (Navigator.canPop(
        context,
      )) {
        Navigator.pop(
          context,
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to submit: $e',
            ),
            backgroundColor:
                AppTheme.dangerRed,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(
          () => _isSubmitting =
              false,
        );
      }
    }
  }

  @override
  Widget build(
    BuildContext context,
  ) {
    return Scaffold(
      backgroundColor:
          context.backgroundColor,

      appBar: AppBar(
        title: Text(
          'Record Visit',
          style:
              AppTheme.headingSmall
                  .copyWith(
            color:
                context.textPrimaryColor,
          ),
        ),
        centerTitle: false,
        backgroundColor:
            context.surfaceColor,
        elevation: 0,
        actions: [
          if (_isSubmitting)
            const Padding(
              padding:
                  EdgeInsets.all(
                16.0,
              ),
              child:
                  SizedBox(
                width: 24,
                height: 24,
                child:
                    CircularProgressIndicator(
                  strokeWidth: 2,
                ),
              ),
            )
          else
            TextButton(
              onPressed:
                  _submit,
              child: Text(
                'SAVE',
                style: AppTheme
                    .buttonText
                    .copyWith(
                  color:
                      context.accentColor,
                ),
              ),
            ),
        ],
      ),

      body: Form(
        key: _formKey,
        child: ListView(
          padding:
              const EdgeInsets.all(
            24,
          ),
          children: [
            _buildSectionTitle(
              '1. Where are you?',
            ),

            TextFormField(
              controller:
                  _siteNameController,
              decoration:
                  AppTheme.inputDecoration(
                label:
                    'Customer / Site Name',
                icon:
                    Icons.business_rounded,
                context:
                    context,
              ),
              style: AppTheme
                  .bodyLarge
                  .copyWith(
                color:
                    context.textPrimaryColor,
              ),
              validator:
                  (val) =>
                      (val == null ||
                              val
                                  .trim()
                                  .isEmpty)
                          ? 'Required'
                          : null,
              textInputAction:
                  TextInputAction.next,
            ),

            const SizedBox(
              height: 16,
            ),

            Container(
              padding:
                  const EdgeInsets.all(
                16,
              ),
              decoration:
                  BoxDecoration(
                color: _currentPosition !=
                        null
                    ? AppTheme
                        .successGreen
                        .withValues(
                        alpha: 0.1,
                      )
                    : context
                        .surfaceColor,
                borderRadius:
                    BorderRadius
                        .circular(
                  12,
                ),
                border:
                    Border.all(
                  color: _currentPosition !=
                          null
                      ? AppTheme
                          .successGreen
                          .withValues(
                          alpha: 0.3,
                        )
                      : context
                          .borderSubtleColor,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    _currentPosition !=
                            null
                        ? Icons
                            .check_circle
                        : Icons
                            .location_on_outlined,
                    color:
                        _currentPosition !=
                                null
                            ? AppTheme
                                .successGreen
                            : context
                                .textSecondaryColor,
                    size: 28,
                  ),

                  const SizedBox(
                    width: 16,
                  ),

                  Expanded(
                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment
                              .start,
                      children: [
                        Text(
                          _currentPosition !=
                                  null
                              ? 'Location Captured'
                              : 'Location Required',
                          style: AppTheme
                              .bodyLarge
                              .copyWith(
                            fontWeight:
                                FontWeight
                                    .w600,
                            color: _currentPosition !=
                                    null
                                ? AppTheme
                                    .successGreen
                                : context
                                    .textPrimaryColor,
                          ),
                        ),

                        if (_addressText !=
                            null) ...[
                          const SizedBox(
                            height: 4,
                          ),
                          Text(
                            _addressText!,
                            style: AppTheme
                                .bodySmall
                                .copyWith(
                              color: context
                                  .textSecondaryColor,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  if (_currentPosition ==
                      null)
                    ElevatedButton(
                      onPressed:
                          _isGettingLocation
                              ? null
                              : _getLocation,
                      style:
                          ElevatedButton.styleFrom(
                        backgroundColor:
                            context
                                .textPrimaryColor,
                        foregroundColor:
                            context
                                .surfaceColor,
                        shape:
                            RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius
                                  .circular(
                            8,
                          ),
                        ),
                      ),
                      child:
                          _isGettingLocation
                              ? SizedBox(
                                  width:
                                      16,
                                  height:
                                      16,
                                  child:
                                      CircularProgressIndicator(
                                    color:
                                        context.surfaceColor,
                                    strokeWidth:
                                        2,
                                  ),
                                )
                              : const Text(
                                  'Capture',
                                ),
                    ),
                ],
              ),
            ),

            const SizedBox(
              height: 32,
            ),

            _buildSectionTitle(
              '2. Site Photos',
            ),

            SizedBox(
              height: 104,
              child: ListView(
                scrollDirection:
                    Axis.horizontal,
                children: [
                  ..._photos
                      .asMap()
                      .entries
                      .map(
                        (e) {
                          final index =
                              e.key;
                          final photo =
                              e.value;

                          return Padding(
                            padding:
                                const EdgeInsets.only(
                              right:
                                  12,
                            ),
                            child:
                                Stack(
                              children: [
                                ClipRRect(
                                  borderRadius:
                                      BorderRadius.circular(
                                    12,
                                  ),
                                  child:
                                      Image.memory(
                                    photo.bytes,
                                    width:
                                        96,
                                    height:
                                        96,
                                    fit: BoxFit
                                        .cover,
                                  ),
                                ),

                                if (photo.uploading)
                                  Container(
                                    width:
                                        96,
                                    height:
                                        96,
                                    decoration:
                                        BoxDecoration(
                                      color:
                                          Colors.black45,
                                      borderRadius:
                                          BorderRadius.circular(
                                        12,
                                      ),
                                    ),
                                    child:
                                        const Center(
                                      child:
                                          SizedBox(
                                        width:
                                            20,
                                        height:
                                            20,
                                        child:
                                            CircularProgressIndicator(
                                          strokeWidth:
                                              2,
                                          color:
                                              Colors.white,
                                        ),
                                      ),
                                    ),
                                  ),

                                Positioned(
                                  top:
                                      4,
                                  right:
                                      4,
                                  child:
                                      GestureDetector(
                                    onTap:
                                        () =>
                                            _removePhotoAt(
                                      index,
                                    ),
                                    child:
                                        Container(
                                      padding:
                                          const EdgeInsets.all(
                                        3,
                                      ),
                                      decoration:
                                          const BoxDecoration(
                                        color:
                                            Colors.black54,
                                        shape:
                                            BoxShape.circle,
                                      ),
                                      child:
                                          const Icon(
                                        Icons.close,
                                        color:
                                            Colors.white,
                                        size:
                                            14,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),

                  GestureDetector(
                    onTap:
                        _pickImage,
                    child:
                        Container(
                      width:
                          96,
                      height:
                          96,
                      decoration:
                          BoxDecoration(
                        color: context
                            .surfaceColor,
                        borderRadius:
                            BorderRadius.circular(
                          12,
                        ),
                        border:
                            Border.all(
                          color: context
                              .borderSubtleColor,
                        ),
                      ),
                      child:
                          Column(
                        mainAxisAlignment:
                            MainAxisAlignment
                                .center,
                        children: [
                          Icon(
                            Icons
                                .add_a_photo_outlined,
                            color: context
                                .textSecondaryColor,
                            size:
                                26,
                          ),
                          const SizedBox(
                            height: 6,
                          ),
                          Text(
                            'Add',
                            style: AppTheme
                                .bodySmall
                                .copyWith(
                              color: context
                                  .textSecondaryColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(
              height: 32,
            ),

            _buildSectionTitle(
              '3. Materials Needed',
            ),

            if (_materials.isEmpty)
              Container(
                width:
                    double.infinity,
                padding:
                    const EdgeInsets.all(
                  16,
                ),
                decoration:
                    BoxDecoration(
                  color: context
                      .surfaceColor,
                  borderRadius:
                      BorderRadius.circular(
                    12,
                  ),
                  border:
                      Border.all(
                    color: context
                        .borderSubtleColor,
                  ),
                ),
                child:
                    Text(
                  'No materials added yet.',
                  style: AppTheme
                      .bodyMedium
                      .copyWith(
                    color: context
                        .textMutedColor,
                  ),
                ),
              )
            else
              ..._materials
                  .asMap()
                  .entries
                  .map(
                    (entry) {
                      final index =
                          entry.key;
                      final material =
                          entry.value;

                      return Padding(
                        padding:
                            const EdgeInsets.only(
                          bottom:
                              12,
                        ),
                        child: Row(
                          crossAxisAlignment:
                              CrossAxisAlignment
                                  .start,
                          children: [
                            Expanded(
                              flex:
                                  3,
                              child:
                                  TextFormField(
                                controller:
                                    material.nameController,
                                decoration:
                                    AppTheme.inputDecoration(
                                  label:
                                      'Material Name',
                                  icon:
                                      Icons.inventory_2_outlined,
                                  context:
                                      context,
                                ),
                                style: AppTheme
                                    .bodyLarge
                                    .copyWith(
                                  color: context
                                      .textPrimaryColor,
                                ),
                                textInputAction:
                                    TextInputAction.next,
                              ),
                            ),

                            const SizedBox(
                              width:
                                  12,
                            ),

                            Expanded(
                              flex:
                                  2,
                              child:
                                  TextFormField(
                                controller:
                                    material.quantityController,
                                decoration:
                                    AppTheme.inputDecoration(
                                  label:
                                      'Qty',
                                  context:
                                      context,
                                ),
                                style: AppTheme
                                    .bodyLarge
                                    .copyWith(
                                  color: context
                                      .textPrimaryColor,
                                ),
                                keyboardType:
                                    const TextInputType
                                        .numberWithOptions(
                                  decimal:
                                      true,
                                ),
                                textInputAction:
                                    TextInputAction.done,
                              ),
                            ),

                            IconButton(
                              icon:
                                  Icon(
                                Icons
                                    .remove_circle_outline,
                                color:
                                    AppTheme
                                        .dangerRed
                                        .withValues(
                                  alpha:
                                      0.8,
                                ),
                              ),
                              onPressed:
                                  () {
                                setState(
                                  () {
                                    _materials
                                        .removeAt(
                                      index,
                                    );
                                  },
                                );
                              },
                            ),
                          ],
                        ),
                      );
                    },
                  ),

            TextButton.icon(
              onPressed:
                  () {
                setState(
                  () {
                    _materials.add(
                      _ManualMaterialEntry(),
                    );
                  },
                );
              },
              icon:
                  Icon(
                Icons
                    .add_circle_outline,
                color:
                    context.accentColor,
              ),
              label:
                  Text(
                'Add Material',
                style: AppTheme
                    .bodyMedium
                    .copyWith(
                  color: context
                      .accentColor,
                  fontWeight:
                      FontWeight.w600,
                ),
              ),
            ),

            const SizedBox(
              height: 32,
            ),

            _buildSectionTitle(
              '4. Visit Details',
            ),

            TextFormField(
              controller:
                  _notesController,
              decoration:
                  AppTheme.inputDecoration(
                label:
                    'Discussion / Notes',
                context:
                    context,
              ),
              style: AppTheme
                  .bodyLarge
                  .copyWith(
                color:
                    context.textPrimaryColor,
              ),
              maxLines:
                  4,
              textInputAction:
                  TextInputAction.next,
            ),

            const SizedBox(
              height: 32,
            ),

            _buildSectionTitle(
              '5. Next Action',
            ),

            Container(
              padding:
                  const EdgeInsets.all(
                16,
              ),
              decoration:
                  BoxDecoration(
                color:
                    context.surfaceColor,
                borderRadius:
                    BorderRadius.circular(
                  12,
                ),
                border:
                    Border.all(
                  color: context
                      .borderSubtleColor,
                ),
              ),
              child: Column(
                children: [
                  TextFormField(
                    controller:
                        _followUpDateController,
                    readOnly:
                        true,
                    onTap:
                        _selectDate,
                    decoration:
                        AppTheme.inputDecoration(
                      label:
                          'Follow-up Date',
                      icon:
                          Icons.calendar_today_rounded,
                      context:
                          context,
                    ),
                    style: AppTheme
                        .bodyLarge
                        .copyWith(
                      color: context
                          .textPrimaryColor,
                    ),
                  ),

                  const SizedBox(
                    height: 16,
                  ),

                  TextFormField(
                    controller:
                        _followUpNotesController,
                    decoration:
                        AppTheme.inputDecoration(
                      label:
                          'Follow-up Task',
                      context:
                          context,
                    ),
                    style: AppTheme
                        .bodyLarge
                        .copyWith(
                      color: context
                          .textPrimaryColor,
                    ),
                    maxLines:
                        2,
                  ),
                ],
              ),
            ),

            const SizedBox(
              height: 32,
            ),

            /*
             * ============================================================
             * 6. OPTIONAL CUSTOMER COPY
             * ============================================================
             */

            _buildSectionTitle(
              '6. Customer Email',
            ),

            Container(
              padding:
                  const EdgeInsets.all(
                16,
              ),
              decoration:
                  BoxDecoration(
                color:
                    context.surfaceColor,
                borderRadius:
                    BorderRadius.circular(
                  12,
                ),
                border:
                    Border.all(
                  color: context
                      .borderSubtleColor,
                ),
              ),
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment
                        .start,
                children: [
                  CheckboxListTile(
                    contentPadding:
                        EdgeInsets.zero,
                    value:
                        _sendToCustomer,
                    onChanged:
                        (value) {
                      setState(
                        () {
                          _sendToCustomer =
                              value ??
                                  false;
                        },
                      );
                    },
                    title:
                        Text(
                      'Send a copy to customer',
                      style: AppTheme
                          .bodyLarge
                          .copyWith(
                        color: context
                            .textPrimaryColor,
                        fontWeight:
                            FontWeight.w600,
                      ),
                    ),
                    subtitle:
                        Text(
                      'The field entry will still be sent to Admin in Kshetra.',
                      style: AppTheme
                          .bodySmall
                          .copyWith(
                        color: context
                            .textSecondaryColor,
                      ),
                    ),
                    controlAffinity:
                        ListTileControlAffinity
                            .leading,
                  ),

                  if (_sendToCustomer) ...[
                    const SizedBox(
                      height: 12,
                    ),

                    TextFormField(
                      controller:
                          _customerEmailController,
                      keyboardType:
                          TextInputType
                              .emailAddress,
                      textInputAction:
                          TextInputAction
                              .done,
                      decoration:
                          AppTheme.inputDecoration(
                        label:
                            'Customer Email Address',
                        icon:
                            Icons.email_outlined,
                        context:
                            context,
                      ),
                      style: AppTheme
                          .bodyLarge
                          .copyWith(
                        color: context
                            .textPrimaryColor,
                      ),
                      validator:
                          (value) {
                        if (!_sendToCustomer) {
                          return null;
                        }

                        final email =
                            value
                                ?.trim() ??
                            '';

                        if (email.isEmpty) {
                          return 'Customer email is required';
                        }

                        if (!RegExp(
                          r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
                        ).hasMatch(
                          email,
                        )) {
                          return 'Enter a valid email address';
                        }

                        return null;
                      },
                    ),

                    const SizedBox(
                      height: 10,
                    ),

                    Text(
                      'The copy will be sent from your connected Gmail account.',
                      style: AppTheme
                          .bodySmall
                          .copyWith(
                        color: context
                            .textSecondaryColor,
                      ),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(
              height: 48,
            ),

            ElevatedButton(
              onPressed:
                  _isSubmitting ||
                          _isUploadingImage
                      ? null
                      : _submit,
              style:
                  AppTheme.primaryButton,
              child:
                  _isSubmitting
                      ? const SizedBox(
                          width:
                              24,
                          height:
                              24,
                          child:
                              CircularProgressIndicator(
                            color:
                                Colors.white,
                            strokeWidth:
                                2,
                          ),
                        )
                      : const Text(
                          'SAVE VISIT RECORD',
                        ),
            ),

            const SizedBox(
              height: 24,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(
    String title,
  ) {
    return Padding(
      padding:
          const EdgeInsets.only(
        bottom: 16,
      ),
      child: Text(
        title,
        style: AppTheme
            .headingSmall
            .copyWith(
          color:
              context.textPrimaryColor,
        ),
      ),
    );
  }
}

class _ManualMaterialEntry {
  final TextEditingController
      nameController =
      TextEditingController();

  final TextEditingController
      quantityController =
      TextEditingController();
}

class _PhotoEntry {
  final Uint8List bytes;

  String? url;

  bool uploading;

  _PhotoEntry({
    required this.bytes,
    this.url,
    this.uploading = true,
  });
}