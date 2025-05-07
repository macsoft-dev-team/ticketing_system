import 'package:flutter/material.dart';
import 'package:ticketing_app/models/sparerequest.dart'; // Import the SpareRequest model
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:ticketing_app/config.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ticketing_app/screens/spare_request_details_screen.dart';
import 'package:ticketing_app/screens/spare_request_screen.dart'; // Import SpareRequestScreen
import 'package:intl/intl.dart';

class SpareRequestsListScreen extends StatefulWidget {
  @override
  _SpareRequestsListScreenState createState() => _SpareRequestsListScreenState();
}

class _SpareRequestsListScreenState extends State<SpareRequestsListScreen> {
  late Future<List<SpareRequest>> spareRequests;
  List<SpareRequest> filteredSpareRequests = [];
  String searchQuery = '';

  @override
  void initState() {
    super.initState();
    spareRequests = fetchSpareRequests();
    spareRequests.then((data) {
      setState(() {
        filteredSpareRequests = data;
      });
    });
  }

  Future<List<SpareRequest>> fetchSpareRequests() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwtToken');

    if (token == null) {
      throw Exception('JWT token not found');
    }

    final response = await http.get(
      Uri.parse('$apiHost/api/spare-requests/user'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => SpareRequest.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load spare requests');
    }
  }

  void filterSpareRequests(String query) {
    setState(() {
      searchQuery = query;
      if (query.isEmpty) {
        spareRequests.then((data) {
          setState(() {
            filteredSpareRequests = data;
          });
        });
      } else {
        filteredSpareRequests = filteredSpareRequests.where((request) {
          return request.requestcode.contains(query) ||
              request.customername.toLowerCase().contains(query.toLowerCase()) ||
              request.controllerno.contains(query) ||
              request.serialno.contains(query) ||
              request.partname.toLowerCase().contains(query.toLowerCase()) ||
              request.status.contains(query);
        }).toList();
      }
    });
  }

  void _refreshSpareRequests() {
    setState(() {
      spareRequests = fetchSpareRequests();
      spareRequests.then((data) {
        filteredSpareRequests = data;
      });
    });
  }

  void _navigateToSpareRequestScreen(SpareRequest spareRequest) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SpareRequestScreen(
          spareRequest: spareRequest,
          onSave: (updatedRequest) {
            _refreshSpareRequests(); // Refresh the list
          },
        ),
      ),
    ).then((updatedRequest) {
      if (updatedRequest != null) {
        setState(() {
          // Update the specific request in the filtered list
          final index = filteredSpareRequests.indexWhere((req) => req.id == updatedRequest.id);
          if (index != -1) {
            filteredSpareRequests[index] = updatedRequest;
          } else {
            filteredSpareRequests.add(updatedRequest);
          }
        });
      }
    });
  }

  TableRow _buildTableRow(String label, String value) {
    return TableRow(
      children: [
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: Text(label, style: TextStyle(fontWeight: FontWeight.bold)),
        ),
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: Text(value),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Spare Requests List'),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: TextField(
              decoration: InputDecoration(
                labelText: 'Search',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: filterSpareRequests,
            ),
          ),
          Expanded(
            child: FutureBuilder<List<SpareRequest>>(
              future: spareRequests,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return Center(child: Text('No spare requests available'));
                } else {
                  return ListView.builder(
                    itemCount: filteredSpareRequests.length,
                    itemBuilder: (context, index) {
                      final request = filteredSpareRequests[index];
                      return GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => SpareRequestDetailsScreen(spareRequest: request,
                                index: index,
                                updateInList: (index, updatedRequest) => {
                                  setState(() {
                                    filteredSpareRequests[index] = updatedRequest;
                                  }),
                                  // _refreshSpareRequests(),
                                }
                              ),
                            ),
                          );
                        },
                        child: Container(
                          margin: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 16.0),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey),
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          child: Table(
                            border: TableBorder.all(color: Colors.grey),
                            columnWidths: {
                              0: FlexColumnWidth(1), // Label column takes 1/3 of the width
                              1: FlexColumnWidth(2), // Value column takes 2/3 of the width
                            },
                            children: [
                              _buildTableRow('Request Code', request.requestcode),
                              _buildTableRow('Created Date', DateFormat('dd-MM-yyyy hh:mm a').format(request.createdAt)),
                              _buildTableRow('Controller No', request.controllerno),
                              _buildTableRow('Customer Name', request.customername),
                              _buildTableRow('Part Name', request.partname),
                              _buildTableRow('Status', request.status),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                }
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          _navigateToSpareRequestScreen(
            SpareRequest(
              id: 0,
              requestcode: '',
              customername: '',
              controllerno: '',
              partname: '',
              quantity: 0,
              serialno: '',
              remarks: '',
              status: 'pending',
              approvedBy: null,
              approvedAt: null,
              createdAt: DateTime.now(),
              updatedAt: DateTime.now(),
              userId: 0,
            ),
          );
        },
        child: Icon(Icons.add),
        tooltip: 'Create Spare Request',
      ),
    );
  }
}
