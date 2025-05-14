import 'package:flutter/material.dart';
import 'ticket_details_screen.dart';
import 'ticket_screen.dart';
import 'package:ticketing_app/models/ticket.dart'; // Import the Ticket model
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:ticketing_app/config.dart';
import 'package:shared_preferences/shared_preferences.dart'; // Import for storing/retrieving JWT token

class TicketsListScreen extends StatefulWidget {
  @override
  _TicketsListScreenState createState() => _TicketsListScreenState();
}

class _TicketsListScreenState extends State<TicketsListScreen> {
  late Future<List<Ticket>> tickets;
  List<Ticket> filteredTickets = [];
  String searchQuery = '';

  @override
  void initState() {
    super.initState();
    tickets = fetchTickets();
    tickets.then((data) {
      setState(() {
        filteredTickets = data;
      });
    });
  }

  Future<List<Ticket>> fetchTickets() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwtToken'); // Retrieve the stored JWT token

    if (token == null) {
      throw Exception('JWT token not found');
    }

    final response = await http.get(
      Uri.parse('$apiHost/api/getticket/user'),
      headers: {
        'Authorization': 'Bearer $token', // Add the Bearer token to the headers
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Ticket.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load tickets');
    }
  }

  void filterTickets(String query) {
    setState(() {
      searchQuery = query;
      if (query.isEmpty) {
        tickets.then((data) {
          setState(() {
            filteredTickets = data;
          });
        });
      } else {
        filteredTickets = filteredTickets.where((ticket) {
          return ticket.ticketcode.contains(query) ||
              ticket.complainttype.contains(query) ||
              ticket.customername.contains(query) ||
              ticket.village.contains(query) ||
              ticket.status.contains(query);
        }).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Tickets List'),
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
              onChanged: filterTickets,
            ),
          ),
          Expanded(
            child: FutureBuilder<List<Ticket>>(
              future: tickets,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return Center(child: Text('No tickets available'));
                } else {
                  return ListView.builder(
                    itemCount: filteredTickets.length,
                    itemBuilder: (context, index) {
                      final ticket = filteredTickets[index];
                      return GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => TicketDetailsScreen(ticket: ticket),
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
                              _buildTableRow('Ticket Code', ticket.ticketcode),
                              _buildTableRow('Complaint Type', ticket.complainttype),
                              _buildTableRow('Customer Name', ticket.customername),
                              _buildTableRow('Village', ticket.village),
                              _buildTableRow('Status', ticket.status),
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
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => TicketScreen(
                ticket: Ticket(
                  id: 0, // Assuming 0 for new ticket
                  ticketcode: '',
                  customername: '',
                  controllerno: '',
                  head: '',
                  imei: '',
                  hp: '',
                  motortype: '',
                  state: '',
                  district: '',
                  village: '',
                  block: '',
                  complainttype: '',
                  faultcode: '',
                  details: '',
                  status: 'Open',
                ),
              ),
            ),
          );
        },
        child: Icon(Icons.add),
      ),
    );
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
}
