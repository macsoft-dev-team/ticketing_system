import 'package:flutter/material.dart';
import 'package:ticketing_app/models/sparerequest.dart'; // Import the SpareRequest model
import 'spare_request_screen.dart'; // Import the SpareRequestScreen
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:ticketing_app/config.dart'; // Import apiHost
import 'package:ticketing_app/models/sparerequestphotos.dart'; // Import SpareRequestPhotos
import 'package:shared_preferences/shared_preferences.dart';

class SpareRequestDetailsScreen extends StatefulWidget {
  final SpareRequest spareRequest;
  final int index; // Add index to identify the object in the list
  final Function(int, SpareRequest) updateInList; // Add update method to update the list

  SpareRequestDetailsScreen({
    required this.spareRequest,
    required this.index,
    required this.updateInList,
  });

  @override
  _SpareRequestDetailsScreenState createState() => _SpareRequestDetailsScreenState();
}

class _SpareRequestDetailsScreenState extends State<SpareRequestDetailsScreen> {
  late SpareRequest _spareRequest;

  @override
  void initState() {
    super.initState();
    _spareRequest = widget.spareRequest;
    _fetchPhotos(); // Fetch photos on initialization
  }

  Future<void> _fetchPhotos() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwtToken');
    if (token == null) {
      throw Exception('JWT token not found');
    }
    // Set up the headers for the request
    final url = Uri.parse('$apiHost/api/spare-requests/${_spareRequest.id}/photos');
    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
      });

      if (response.statusCode == 200) {
        final List<dynamic> photosJson = json.decode(response.body);
        final photos = photosJson.map((photo) => SpareRequestPhotos.fromJson(photo)).toList();
        setState(() {
          // use setter on _spareRequest to update photos
          _spareRequest.setPhotos = photos;
        });
      } else {
        throw Exception('Failed to fetch photos');
      }
    } catch (error) {
      print('Error fetching photos: $error');
    }
  }

  void _refreshDetails(SpareRequest updatedRequest) {
    setState(() {
      _spareRequest = updatedRequest;
    });
    widget.updateInList(widget.index, updatedRequest); // Update the object in the list
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Spare Request Details'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SingleChildScrollView(
          child: Column(
            children: [
              Table(
                border: TableBorder.all(color: Colors.grey),
                columnWidths: {
                  0: FlexColumnWidth(1),
                  1: FlexColumnWidth(2),
                },
                children: [
                  _buildTableRow('Request Code', _spareRequest.requestcode),
                  _buildTableRow('Created Date', DateFormat('dd-MM-yyyy hh:mm a').format(_spareRequest.createdAt)),
                  _buildTableRow('Customer Name', _spareRequest.customername),
                  _buildTableRow('Controller No', _spareRequest.controllerno),
                  _buildTableRow('Part Name', _spareRequest.partname),
                  _buildTableRow('Quantity', _spareRequest.quantity.toString()),
                  _buildTableRow('Serial No', _spareRequest.serialno),
                  _buildTableRow('Remarks', _spareRequest.remarks),
                  _buildTableRow('Status', _spareRequest.status),
                ],
              ),
              SizedBox(height: 16.0),
              _buildPhotosSection(), // Add photos section
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => SpareRequestScreen(
                spareRequest: _spareRequest,
                onSave: (updatedRequest) => _refreshDetails(updatedRequest), // Pass the callback
              ),
            ),
          ).then((updatedRequest) {
            if (updatedRequest != null) {
              _refreshDetails(updatedRequest); // Refresh details with updated request
            }
          });
        },
        child: Icon(Icons.edit),
        tooltip: 'Edit Spare Request',
      ),
    );
  }

  Widget _buildPhotosSection() {
    if (_spareRequest.photos == null || _spareRequest.photos!.isEmpty) {
      return Text('No photos available');
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Photos:', style: TextStyle(fontWeight: FontWeight.bold)),
        SizedBox(height: 8.0),
        Wrap(
          spacing: 8.0,
          runSpacing: 8.0,
          children: _spareRequest.photos!.map((photo) {
            return Column(
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
                Text(photo.caption ?? '', style: const TextStyle(fontSize: 12.0)),
              ],
            );
          }).toList(),
        ),
      ],
    );
  }

  TableRow _buildTableRow(String key, String value) {
    return TableRow(
      children: [
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: Text(key, style: TextStyle(fontWeight: FontWeight.bold)),
        ),
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: Text(value),
        ),
      ],
    );
  }
}
