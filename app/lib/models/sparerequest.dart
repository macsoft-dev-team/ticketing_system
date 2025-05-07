import 'sparerequestphotos.dart'; // Import SpareRequestPhotos

class SpareRequest {
  final int id;
  String requestcode;
  String customername;
  String controllerno;
  String partname;
  int quantity;
  String serialno;
  String remarks;
  String status;
  String? approvedBy;
  DateTime? approvedAt;
  DateTime createdAt;
  DateTime updatedAt;
  int userId;
  List<SpareRequestPhotos>? photos; // Make photos optional

  SpareRequest({
    required this.id,
    required this.requestcode,
    required this.customername,
    required this.controllerno,
    required this.partname,
    required this.quantity,
    required this.serialno,
    required this.remarks,
    required this.status,
    required this.approvedBy,
    this.approvedAt,
    required this.createdAt,
    required this.updatedAt,
    required this.userId,
    this.photos, // Make photos optional
  });

  //setter for status
  set setStatus(String status) {
    this.status = status;
  }

  //setter for photos
  set setPhotos(List<SpareRequestPhotos>? photos) {
    this.photos = photos;
  }

  factory SpareRequest.fromJson(Map<String, dynamic> json) {
    return SpareRequest(
      id: json['id'],
      requestcode: json['requestcode'] ?? '', // Provide default value for null
      customername: json['customername'] ?? '', // Provide default value for null
      controllerno: json['controllerno'] ?? '', // Provide default value for null
      partname: json['partname'] ?? '', // Provide default value for null
      quantity: json['quantity'] ?? 0, // Provide default value for null
      serialno: json['serialno'] ?? '', // Provide default value for null
      remarks: json['remarks'] ?? '', // Provide default value for null
      status: json['status'] ?? '', // Provide default value for null
      approvedBy: json['approved_by'] != null ? json['approved_by'].toString() : null,
      approvedAt: json['approved_at'] != null ? DateTime.parse(json['approved_at']) : null,
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
      userId: json['user_id'],
      photos: (json['photos'] as List<dynamic>?)
              ?.map((photo) => SpareRequestPhotos.fromJson(photo))
              .toList(), // Parse nested photos or default to null
    );
  }
}
