class SpareRequestPhotos {
  final String id;
  final int spareRequestId;
  final String photoPath;
  final String? caption; // Make caption optional

  SpareRequestPhotos({
    required this.id,
    required this.spareRequestId,
    required this.photoPath,
    this.caption, // Make caption optional
  });

  factory SpareRequestPhotos.fromJson(Map<String, dynamic> json) {
    return SpareRequestPhotos(
      id: json['id'],
      spareRequestId: json['spare_request_id'],
      photoPath: json['photo_path'],
      caption: json['caption'], // No default value needed since it's optional
    );
  }
}
