import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'models/models.dart';

final String baseUrl = kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}

class ApiRepository {
  final http.Client client;
  final FlutterSecureStorage storage;

  ApiRepository({http.Client? client, FlutterSecureStorage? storage})
      : client = client ?? http.Client(),
        storage = storage ?? const FlutterSecureStorage();

  Future<Map<String, String>> _getHeaders() async {
    final token = await storage.read(key: 'jwt_token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ─── Dashboard ──────────────────────────────────────────
  Future<Map<String, dynamic>> getDashboardSummary() async {
    final response = await client.get(
      Uri.parse('$baseUrl/employees/me/dashboard'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw ApiException('Failed to load dashboard summary');
    }
  }

  // ─── Profile ────────────────────────────────────────────
  Future<Employee> getProfile() async {
    final response = await client.get(
      Uri.parse('$baseUrl/employees/me/profile'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return Employee.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Failed to load profile');
    }
  }

  Future<Employee> uploadProfilePicture(String filePath) async {
    final token = await storage.read(key: 'jwt_token');
    
    var request = http.MultipartRequest('PUT', Uri.parse('$baseUrl/employees/me/profile-picture'));
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    
    request.files.add(await http.MultipartFile.fromPath('file', filePath));
    
    final streamedResponse = await client.send(request);
    final response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode == 200) {
      return Employee.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Failed to upload profile picture');
    }
  }

  // ─── Field Visits ───────────────────────────────────────
  Future<Map<String, dynamic>> getVisits({int page = 1, int limit = 20}) async {
    final response = await client.get(
      Uri.parse('$baseUrl/employees/me/visits?page=$page&limit=$limit'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return {
        'visits': (data['visits'] as List).map((i) => FieldVisit.fromJson(i)).toList(),
        'total': data['total'],
      };
    } else {
      throw ApiException('Failed to load visits');
    }
  }

  Future<FieldVisit> getVisitDetail(String id) async {
    final response = await client.get(
      Uri.parse('$baseUrl/employees/me/visits/$id'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return FieldVisit.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Failed to load visit detail');
    }
  }

  Future<FieldVisit> createVisit(Map<String, dynamic> data) async {
    final response = await client.post(
      Uri.parse('$baseUrl/employees/me/visits'),
      headers: await _getHeaders(),
      body: jsonEncode(data),
    );

    if (response.statusCode == 201) {
      return FieldVisit.fromJson(jsonDecode(response.body));
    } else {
      try {
        final body = jsonDecode(response.body);
        if (body['message'] != null) {
          throw ApiException(body['message']);
        }
      } catch (e) {
        if (e is ApiException) rethrow;
      }
      throw ApiException('Failed to create visit');
    }
  }

  Future<void> deleteVisit(String id) async {
    final response = await client.delete(
      Uri.parse('$baseUrl/employees/me/visits/$id'),
      headers: await _getHeaders(),
    );

    if (response.statusCode != 200 && response.statusCode != 204) {
      throw ApiException('Failed to delete visit');
    }
  }

  // ─── Follow-Ups ─────────────────────────────────────────
  Future<List<FollowUp>> getFollowUps({String? status}) async {
    final uri = Uri.parse('$baseUrl/employees/me/follow-ups').replace(
      queryParameters: status != null ? {'status': status} : null,
    );
    final response = await client.get(
      uri,
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return (jsonDecode(response.body) as List).map((i) => FollowUp.fromJson(i)).toList();
    } else {
      throw ApiException('Failed to load follow-ups');
    }
  }

  Future<FollowUp> updateFollowUpStatus(String id, String status) async {
    final response = await client.patch(
      Uri.parse('$baseUrl/employees/me/follow-ups/$id'),
      headers: await _getHeaders(),
      body: jsonEncode({'status': status}),
    );

    if (response.statusCode == 200) {
      return FollowUp.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Failed to update follow-up status');
    }
  }

  // ─── Customer Sites ─────────────────────────────────────
  Future<List<CustomerSite>> getCustomerSites() async {
    final response = await client.get(
      Uri.parse('$baseUrl/customer-sites'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return (jsonDecode(response.body) as List).map((i) => CustomerSite.fromJson(i)).toList();
    } else {
      throw ApiException('Failed to load customer sites');
    }
  }

  Future<CustomerSite> createCustomerSite(String name, String address, {String? geoTag}) async {
    final response = await client.post(
      Uri.parse('$baseUrl/customer-sites'),
      headers: await _getHeaders(),
      body: jsonEncode({
        'name': name,
        'address': address,
        'geoTag': geoTag,
      }),
    );

    if (response.statusCode == 201) {
      return CustomerSite.fromJson(jsonDecode(response.body));
    } else {
      throw ApiException('Failed to create customer site');
    }
  }

  // ─── Materials ──────────────────────────────────────────
  Future<List<MaterialItem>> getMaterials() async {
    final response = await client.get(
      Uri.parse('$baseUrl/materials'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return (jsonDecode(response.body) as List).map((i) => MaterialItem.fromJson(i)).toList();
    } else {
      throw ApiException('Failed to load materials');
    }
  }
}
