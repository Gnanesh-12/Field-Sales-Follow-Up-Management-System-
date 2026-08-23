class Employee {
  final String id;
  final String name;
  final String? phone;
  final String role;
  final String status;
  final String? profilePicture;
  final DateTime createdAt;

  Employee({
    required this.id,
    required this.name,
    this.phone,
    required this.role,
    required this.status,
    this.profilePicture,
    required this.createdAt,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['id'],
      name: json['name'],
      phone: json['phone'],
      role: json['role'] ?? 'employee-role',
      status: json['status'] ?? 'active',
      profilePicture: json['profilePicture'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']).toLocal() : DateTime.now(),
    );
  }
}

class CustomerSite {
  final String id;
  final String name;
  final String address;
  final String? geoTag;

  CustomerSite({
    required this.id,
    required this.name,
    required this.address,
    this.geoTag,
  });

  factory CustomerSite.fromJson(Map<String, dynamic> json) {
    return CustomerSite(
      id: json['id'],
      name: json['name'],
      address: json['address'],
      geoTag: json['geoTag'],
    );
  }
}

class MaterialItem {
  final String id;
  final String name;
  final String unit;

  MaterialItem({
    required this.id,
    required this.name,
    required this.unit,
  });

  factory MaterialItem.fromJson(Map<String, dynamic> json) {
    return MaterialItem(
      id: json['id'],
      name: json['name'],
      unit: json['unit'],
    );
  }
}

class Location {
  final double lat;
  final double lng;
  final double? accuracy;

  Location({
    required this.lat,
    required this.lng,
    this.accuracy,
  });

  factory Location.fromJson(Map<String, dynamic> json) {
    return Location(
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      accuracy: json['accuracy'] != null ? (json['accuracy'] as num).toDouble() : null,
    );
  }
}

class Attachment {
  final String fileUrl;
  final String type;

  Attachment({
    required this.fileUrl,
    required this.type,
  });

  factory Attachment.fromJson(Map<String, dynamic> json) {
    return Attachment(
      fileUrl: json['fileUrl'],
      type: json['type'] ?? 'image',
    );
  }
}

class MaterialSupply {
  final double quantity;
  final String materialId;
  final MaterialItem? material;

  MaterialSupply({
    required this.quantity,
    required this.materialId,
    this.material,
  });

  factory MaterialSupply.fromJson(Map<String, dynamic> json) {
    return MaterialSupply(
      quantity: (json['quantity'] as num).toDouble(),
      materialId: json['materialId'],
      material: json['material'] != null ? MaterialItem.fromJson(json['material']) : null,
    );
  }
}

class FollowUp {
  final String id;
  final DateTime dueDate;
  final String status;
  final String? notes;
  final String fieldVisitId;
  final FieldVisit? visit; // Sometimes included

  FollowUp({
    required this.id,
    required this.dueDate,
    required this.status,
    this.notes,
    required this.fieldVisitId,
    this.visit,
  });

  factory FollowUp.fromJson(Map<String, dynamic> json) {
    return FollowUp(
      id: json['id'],
      dueDate: DateTime.parse(json['dueDate']).toLocal(),
      status: json['status'],
      notes: json['notes'],
      fieldVisitId: json['fieldVisitId'],
      visit: json['visit'] != null ? FieldVisit.fromJson(json['visit']) : null,
    );
  }
}

class FieldVisit {
  final String id;
  final DateTime timestamp;
  final String? notes;
  final String? remarks;
  final String employeeId;
  final String customerSiteId;
  final CustomerSite? site;
  final Location? location;
  final List<Attachment> attachments;
  final List<MaterialSupply> materials;
  final List<FollowUp> followUps;

  FieldVisit({
    required this.id,
    required this.timestamp,
    this.notes,
    this.remarks,
    required this.employeeId,
    required this.customerSiteId,
    this.site,
    this.location,
    this.attachments = const [],
    this.materials = const [],
    this.followUps = const [],
  });

  factory FieldVisit.fromJson(Map<String, dynamic> json) {
    return FieldVisit(
      id: json['id'],
      timestamp: DateTime.parse(json['timestamp']).toLocal(),
      notes: json['notes'],
      remarks: json['remarks'],
      employeeId: json['employeeId'],
      customerSiteId: json['customerSiteId'],
      site: json['site'] != null ? CustomerSite.fromJson(json['site']) : null,
      location: json['location'] != null ? Location.fromJson(json['location']) : null,
      attachments: json['attachments'] != null
          ? (json['attachments'] as List).map((i) => Attachment.fromJson(i)).toList()
          : [],
      materials: json['materials'] != null
          ? (json['materials'] as List).map((i) => MaterialSupply.fromJson(i)).toList()
          : [],
      followUps: json['followUps'] != null
          ? (json['followUps'] as List).map((i) => FollowUp.fromJson(i)).toList()
          : [],
    );
  }
}
