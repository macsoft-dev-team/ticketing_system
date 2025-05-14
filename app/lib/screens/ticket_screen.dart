import 'package:flutter/material.dart';
import 'package:ticketing_app/models/ticket.dart';

class TicketScreen extends StatelessWidget {
  final Ticket ticket;

  TicketScreen({required this.ticket});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Edit Ticket'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                decoration: InputDecoration(labelText: 'Ticket Code'),
                controller: TextEditingController(text: ticket.ticketcode),
              ),
              TextField(
                decoration: InputDecoration(labelText: 'Customer Name'),
                controller: TextEditingController(text: ticket.customername),
              ),
              TextField(
                decoration: InputDecoration(labelText: 'Controller No'),
                controller: TextEditingController(text: ticket.controllerno),
              ),
              TextField(
                decoration: InputDecoration(labelText: 'Head'),
                controller: TextEditingController(text: ticket.head),
              ),
              TextField(
                decoration: InputDecoration(labelText: 'IMEI'),
                controller: TextEditingController(text: ticket.imei),
              ),
              TextField(
                decoration: InputDecoration(labelText: 'HP'),
                controller: TextEditingController(text: ticket.hp),
              ),
              TextField(
                decoration: InputDecoration(labelText: 'Motor Type'),
                controller: TextEditingController(text: ticket.motortype),
              ),
              TextField(
                decoration: InputDecoration(labelText: 'State'),
                controller: TextEditingController(text: ticket.state),
              ),
              TextField(
                decoration: InputDecoration(labelText: 'District'),
                controller: TextEditingController(text: ticket.district),
              ),
              TextField(
                decoration: InputDecoration(labelText: 'Village'),
                controller: TextEditingController(text: ticket.village),
              ),
              TextField(
                decoration: InputDecoration(labelText: 'Block'),
                controller: TextEditingController(text: ticket.block),
              ),
              TextField(
                decoration: InputDecoration(labelText: 'Complaint Type'),
                controller: TextEditingController(text: ticket.complainttype),
              ),
              TextField(
                decoration: InputDecoration(labelText: 'Fault Code'),
                controller: TextEditingController(text: ticket.faultcode),
              ),
              TextField(
                decoration: InputDecoration(labelText: 'Details'),
                controller: TextEditingController(text: ticket.details),
              ),
              SizedBox(height: 16.0),
              DropdownButtonFormField<String>(
                value: ticket.status,
                decoration: InputDecoration(labelText: 'Status'),
                items: ['open', 'close']
                    .map((status) => DropdownMenuItem(
                          value: status,
                          child: Text(status),
                        ))
                    .toList(),
                onChanged: (newValue) {
                  // Handle status change logic here
                },
              ),
              SizedBox(height: 16.0),
              ElevatedButton(
                onPressed: () {
                  // Save logic here
                  Navigator.pop(context);
                },
                child: Text('Save'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
