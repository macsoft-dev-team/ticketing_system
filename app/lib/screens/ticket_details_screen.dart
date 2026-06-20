import 'package:flutter/material.dart';
import 'package:ticketing_app/screens/ticket_screen.dart';
import 'package:ticketing_app/models/ticket.dart'; // Import the Ticket model
import 'package:image_picker/image_picker.dart'; // Import ImagePicker for photo selection
import 'dart:io'; // Import dart:io for File handling
import 'package:intl/intl.dart'; // Import intl for date formatting

class TicketDetailsScreen extends StatefulWidget {
  final Ticket ticket;

  TicketDetailsScreen({required this.ticket});

  @override
  _TicketDetailsScreenState createState() => _TicketDetailsScreenState();
}

class _TicketDetailsScreenState extends State<TicketDetailsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final List<Map<String, String>> _messages = []; // List to store chat messages
  final TextEditingController _messageController = TextEditingController();
  final ImagePicker _picker = ImagePicker(); // Initialize ImagePicker

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() {}); // Trigger rebuild when the tab changes
    });

    // Add sample conversation messages with valid image URLs
    _messages.addAll([
      {
        'sender': 'Customer',
        'content': 'I am facing an issue with the motor.',
        'timestamp': '2023-10-01 10:30 AM',
      },
      {
        'sender': 'Support',
        'content': 'Can you please provide more details?',
        'timestamp': '2023-10-01 10:35 AM',
      },
      {
        'sender': 'Customer',
        'imageUrl': 'https://picsum.photos/150', // Valid placeholder image URL
        'timestamp': '2023-10-01 10:40 AM',
      },
      {
        'sender': 'Support',
        'content': 'Thank you for the details. We will look into it.',
        'timestamp': '2023-10-01 10:45 AM',
      },
      {
        'sender': 'Customer',
        'imageUrl': 'https://picsum.photos/200', // Another valid placeholder image URL
        'timestamp': '2023-10-01 11:00 AM',
      },
    ]);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Ticket Details'),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'Details'),
            Tab(text: 'Conversations'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDetailsTab(),
          _buildConversationsTab(),
        ],
      ),
    );
  }

  Widget _buildDetailsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Table(
            border: TableBorder.all(color: Colors.grey), // Add borders to the table
            columnWidths: {
              0: FlexColumnWidth(1), // Left column takes 1/3 of the width
              1: FlexColumnWidth(2), // Right column takes 2/3 of the width
            },
            children: [
              _buildTableRow('Ticket Code', widget.ticket.ticketcode),
              _buildTableRow('Customer Name', widget.ticket.customername),
              _buildTableRow('Controller No', widget.ticket.controllerno),
              _buildTableRow('Head', widget.ticket.head),
              _buildTableRow('IMEI', widget.ticket.imei),
              _buildTableRow('HP', widget.ticket.hp),
              _buildTableRow('Motor Type', widget.ticket.motortype),
              _buildTableRow('State', widget.ticket.state),
              _buildTableRow('District', widget.ticket.district),
              _buildTableRow('Village', widget.ticket.village),
              _buildTableRow('Block', widget.ticket.block),
              _buildTableRow('Complaint Type', widget.ticket.complainttype),
              _buildTableRow('Fault Code', widget.ticket.faultcode),
              _buildTableRow('Details', widget.ticket.details),
              _buildTableRow('Status', widget.ticket.status),
            ],
          ),
          SizedBox(height: 16.0),
          Center(
            child: ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => TicketScreen(ticket: widget.ticket),
                  ),
                );
              },
              child: Text('Edit Ticket'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConversationsTab() {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            itemCount: _messages.length,
            itemBuilder: (context, index) {
              final message = _messages[index];
              final isImage = message.containsKey('imageUrl'); // Check if the message contains an image
              return ListTile(
                title: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(message['sender'] ?? 'Unknown'),
                    Text(
                      message['timestamp'] ?? '',
                      style: TextStyle(fontSize: 12.0, color: Colors.grey),
                    ),
                  ],
                ),
                subtitle: isImage
                    ? Material(
                        elevation: 4.0, // Add elevation for the image
                        borderRadius: BorderRadius.circular(8.0), // Optional: Add rounded corners
                        child: SizedBox(
                          width: double.infinity, // Make the image full width
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(8.0), // Match the rounded corners
                            child: message['imageUrl']!.startsWith('http') // Check if the image is a URL or local file
                                ? Image.network(
                                    message['imageUrl'] ?? '',
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) => Text('Failed to load image'),
                                  )
                                : Image.file(
                                    File(message['imageUrl'] ?? ''),
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) => Text('Failed to load image'),
                                  ),
                          ),
                        ),
                      )
                    : Text(message['content'] ?? ''),
              );
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: Row(
            children: [
              IconButton(
                icon: Icon(Icons.photo),
                onPressed: _pickImage, // Call the method to pick an image
              ),
              Expanded(
                child: TextField(
                  controller: _messageController,
                  decoration: InputDecoration(
                    hintText: 'Enter your message',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              IconButton(
                icon: Icon(Icons.send),
                onPressed: _sendMessage,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 70,
      maxWidth: 1200,
      maxHeight: 1200,
    ); // Pick and compress image from the camera
    if (image != null) {
      setState(() {
        _messages.add({
          'sender': 'You',
          'imageUrl': image.path, // Use the local file path for the image
          'timestamp': _formatTimestamp(DateTime.now()), // Format the timestamp
        });
      });
    }
  }

  void _sendMessage() {
    if (_messageController.text.isNotEmpty) {
      setState(() {
        _messages.add({
          'sender': 'You',
          'content': _messageController.text,
          'timestamp': _formatTimestamp(DateTime.now()), // Format the timestamp
        });
      });
      _messageController.clear();
    }
  }

  String _formatTimestamp(DateTime dateTime) {
    return DateFormat('yyyy-MM-dd hh:mm a').format(dateTime); // Format to "YYYY-MM-DD hh:mm AM/PM"
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
