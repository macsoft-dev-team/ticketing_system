import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:convert'; // Import for jsonEncode
import 'package:ticketing_app/config.dart'; // Import apiHost
import 'package:ticketing_app/models/sparerequest.dart'; // Import SpareRequest model
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ticketing_app/models/sparerequestphotos.dart'; // Import SpareRequestPhotos

class SpareRequestScreen extends StatefulWidget {
  final SpareRequest spareRequest;
  final Function(SpareRequest) onSave; // Modify callback to accept updated request

  SpareRequestScreen({required this.spareRequest, required this.onSave});

  @override
  _SpareRequestScreenState createState() => _SpareRequestScreenState();
}

class _SpareRequestScreenState extends State<SpareRequestScreen> {
  final List<File> _photos = [];
  final List<String> _removedPhotos = []; // Track removed photos by their ID
  final ImagePicker _picker = ImagePicker();

  final TextEditingController _customerNameController = TextEditingController();
  final TextEditingController _controllerNoController = TextEditingController();
  final TextEditingController _partNameController = TextEditingController();
  final TextEditingController _quantityController = TextEditingController();
  final TextEditingController _serialNoController = TextEditingController();
  final TextEditingController _remarksController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _customerNameController.text = widget.spareRequest.customername ?? '';
    _controllerNoController.text = widget.spareRequest.controllerno ?? '';
    _partNameController.text = widget.spareRequest.partname ?? '';
    _quantityController.text = widget.spareRequest.quantity?.toString() ?? '';
    _serialNoController.text = widget.spareRequest.serialno ?? '';
    _remarksController.text = widget.spareRequest.remarks ?? '';
  }

  @override
  void dispose() {
    _customerNameController.dispose();
    _controllerNoController.dispose();
    _partNameController.dispose();
    _quantityController.dispose();
    _serialNoController.dispose();
    _remarksController.dispose();
    super.dispose();
  }

  Future<void> _capturePhoto() async {
    final XFile? photo = await _picker.pickImage(source: ImageSource.camera);
    if (photo != null) {
      setState(() {
        _photos.add(File(photo.path));
      });
    }
  }

  void _removePhoto(int index) {
    setState(() {
      _photos.removeAt(index);
    });
  }

  void _removePhotoFromServerList(String photoId) {
    setState(() {
      _removedPhotos.add(photoId); // Add the photo ID to the removed list
    });
  }

  Future<void> _saveSpareRequest() async {
    final url = widget.spareRequest.id == 0
        ? Uri.parse('$apiHost/api/spare-requests')
        : Uri.parse('$apiHost/api/spare-requests/${widget.spareRequest.id}');

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwtToken');

    try {
      final request = http.MultipartRequest(
        widget.spareRequest.id == 0 ? 'POST' : 'PUT',
        url,
      );

      // Add headers
      request.headers['Authorization'] = 'Bearer $token';
      if (widget.spareRequest.id != 0) {
        request.fields['requestcode'] = widget.spareRequest.requestcode;
      }
      // Add text fields
      request.fields['customername'] = _customerNameController.text;
      request.fields['controllerno'] = _controllerNoController.text;
      request.fields['partname'] = _partNameController.text;
      request.fields['quantity'] = _quantityController.text;
      request.fields['serialno'] = _serialNoController.text;
      request.fields['remarks'] = _remarksController.text;
      request.fields['status'] = widget.spareRequest.status;

      // Add photos
      for (int i = 0; i < _photos.length; i++) {
        final photo = _photos[i];
        request.files.add(await http.MultipartFile.fromPath(
          'photos', // Field name for photos
          photo.path,
        ));
      }

      // Add removed photo IDs. convert the list of string ids to comma seperated string
      request.fields['removedPhotos'] = _removedPhotos.join(',');
      

      // Send request
      final response = await request.send();

      if (response.statusCode == 200) {
        // Extract the SpareRequest object from response.data
        final responseBody = json.decode(await response.stream.bytesToString());
        final updatedRequest = SpareRequest.fromJson(responseBody['data']);
        // responseBody['photos'] is a json array of photos. convert this to list
        final List<dynamic> photosJson = responseBody['photos'];
        final photos = photosJson.map((photo) => SpareRequestPhotos.fromJson(photo)).toList();

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Spare request saved successfully')),
        );
        updatedRequest.setPhotos = photos;
        widget.onSave(updatedRequest); // Pass updated request back
        Navigator.pop(context, updatedRequest); // Return updated request
      } else {
        throw Exception('Failed to save spare request');
      }
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving spare request')),
      );
    }
  }

  Widget _buildPhotosSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Photos:', style: TextStyle(fontWeight: FontWeight.bold)),
        SizedBox(height: 8.0),
        Wrap(
          spacing: 8.0,
          runSpacing: 8.0,
          children: [
            // Display existing photos from the server
            if (widget.spareRequest.photos != null)
              ...widget.spareRequest.photos!.map((photo) {
                if (_removedPhotos.contains(photo.id)) return SizedBox.shrink(); // Skip removed photos
                return Stack(
                  children: [
                    Material(
                      elevation: 4.0,
                      borderRadius: BorderRadius.circular(8.0),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8.0),
                        child: Image.network(
                          apiHost + photo.photoPath,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    Positioned(
                      top: 0,
                      right: 0,
                      child: IconButton(
                        icon: Icon(Icons.delete, color: Colors.red),
                        onPressed: () {
                          _removePhotoFromServerList(photo.id); // Pass photo ID
                        },
                      ),
                    ),
                  ],
                );
              }).toList(),
            // Display newly added photos
            ..._photos.asMap().entries.map((entry) {
              int index = entry.key;
              var photo = entry.value;
              return Stack(
                children: [
                  Material(
                    elevation: 4.0,
                    borderRadius: BorderRadius.circular(8.0),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8.0),
                      child: Image.file(
                        photo,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  Positioned(
                    top: 0,
                    right: 0,
                    child: IconButton(
                      icon: Icon(Icons.delete, color: Colors.red),
                      onPressed: () {
                        _removePhoto(index); // Remove from _photos
                      },
                    ),
                  ),
                ],
              );
            }).toList(),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.spareRequest.id == 0 ? 'New Spare Request' : 'Edit Spare Request'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                decoration: InputDecoration(labelText: 'Customer Name'),
                controller: _customerNameController,
              ),
              TextField(
                decoration: InputDecoration(labelText: 'Controller No'),
                controller: _controllerNoController,
              ),
              TextField(
                decoration: InputDecoration(labelText: 'Part Name'),
                controller: _partNameController,
              ),
              TextField(
                decoration: InputDecoration(labelText: 'Quantity'),
                controller: _quantityController,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              ),
              TextField(
                decoration: InputDecoration(labelText: 'Serial No'),
                controller: _serialNoController,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              ),
              TextField(
                decoration: InputDecoration(labelText: 'Remarks'),
                controller: _remarksController,
              ),
              DropdownButtonFormField<String>(
                decoration: InputDecoration(labelText: 'Status'),
                value: widget.spareRequest.status,
                items: ['pending', 'approved', 'sent']
                    .map((status) => DropdownMenuItem(
                          value: status,
                          child: Text(status),
                        ))
                    .toList(),
                onChanged: (value) {
                  widget.spareRequest.setStatus = value!;
                },
              ),
              SizedBox(height: 16.0),
              _buildPhotosSection(), // Add photos section
              SizedBox(height: 16.0),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ElevatedButton.icon(
                    onPressed: _capturePhoto,
                    icon: Icon(Icons.camera_alt),
                    label: Text('Add Photo'),
                  ),
                  ElevatedButton(
                    onPressed: _saveSpareRequest,
                    child: Text('Save'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
