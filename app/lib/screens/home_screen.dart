import 'tickets_list_screen.dart';
import 'spare_requests_list_screen.dart'; // Updated import for SpareRequestsListScreen
import 'package:ticketing_app/utils/auth_service.dart'; // Import AuthService
import 'login_screen.dart'; // Import LoginScreen for navigation
import 'package:flutter/material.dart';

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    TicketsListScreen(),
    SpareRequestsListScreen(), // Updated to use SpareRequestsListScreen
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  void _logout() async {
    await AuthService.clearToken(); // Clear the JWT token
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => LoginScreen()),
      (route) => false, // Remove all previous routes
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Home'),
        actions: [
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: _logout, // Call the logout function
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Text(
                      'Tickets by Status',
                      style: TextStyle(fontSize: 18.0, fontWeight: FontWeight.bold),
                    ),
                  ),
                  DataTable(
                    columns: [
                      DataColumn(label: Text('Status')),
                      DataColumn(label: Text('YTD')),
                      DataColumn(label: Text('MTD')),
                      DataColumn(label: Text('Today')),
                    ],
                    rows: [
                      DataRow(cells: [
                        DataCell(Text('Open')),
                        DataCell(Text('120')),
                        DataCell(Text('30')),
                        DataCell(Text('5')),
                      ]),
                      DataRow(cells: [
                        DataCell(Text('Closed')),
                        DataCell(Text('100')),
                        DataCell(Text('20')),
                        DataCell(Text('3')),
                      ]),
                    ],
                  ),
                  SizedBox(height: 16.0),
                  Center(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => TicketsListScreen()),
                        );
                      },
                      child: Text('View Tickets List'),
                    ),
                  ),
                  SizedBox(height: 16.0),
                  Center(
                    child: Text(
                      'Spare Requests by Status',
                      style: TextStyle(fontSize: 18.0, fontWeight: FontWeight.bold),
                    ),
                  ),
                  DataTable(
                    columns: [
                      DataColumn(label: Text('Status')),
                      DataColumn(label: Text('YTD')),
                      DataColumn(label: Text('MTD')),
                      DataColumn(label: Text('Today')),
                    ],
                    rows: [
                      DataRow(cells: [
                        DataCell(Text('Open')),
                        DataCell(Text('80')),
                        DataCell(Text('25')),
                        DataCell(Text('4')),
                      ]),
                      DataRow(cells: [
                        DataCell(Text('Closed')),
                        DataCell(Text('70')),
                        DataCell(Text('15')),
                        DataCell(Text('2')),
                      ]),
                    ],
                  ),
                  SizedBox(height: 16.0),
                  Center(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => SpareRequestsListScreen()),
                        );
                      },
                      child: Text('View Spare Requests List'),
                    ),
                  ),
                  SizedBox(height: 16.0),
                  Center(
                    child: Text(
                      'Tickets by Age',
                      style: TextStyle(fontSize: 18.0, fontWeight: FontWeight.bold),
                    ),
                  ),
                  DataTable(
                    columns: [
                      DataColumn(label: Text('Age Range')),
                      DataColumn(label: Text('Count')),
                    ],
                    rows: [
                      DataRow(cells: [
                        DataCell(Text('1-5 days')),
                        DataCell(Text('50')),
                      ]),
                      DataRow(cells: [
                        DataCell(Text('6-10 days')),
                        DataCell(Text('30')),
                      ]),
                      DataRow(cells: [
                        DataCell(Text('10-15 days')),
                        DataCell(Text('20')),
                      ]),
                      DataRow(cells: [
                        DataCell(Text('Above 15 days')),
                        DataCell(Text('10')),
                      ]),
                    ],
                  ),
                  SizedBox(height: 16.0),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Text(
                      'Tickets Status for Last 7 Days',
                      style: TextStyle(fontSize: 18.0, fontWeight: FontWeight.bold),
                    ),
                  ),
                  DataTable(
                    columns: [
                      DataColumn(label: Text('Date')),
                      DataColumn(label: Text('Open')),
                      DataColumn(label: Text('Closed')),
                    ],
                    rows: [
                      DataRow(cells: [DataCell(Text('2023-10-01')), DataCell(Text('5')), DataCell(Text('3'))]),
                      DataRow(cells: [DataCell(Text('2023-10-02')), DataCell(Text('6')), DataCell(Text('4'))]),
                      DataRow(cells: [DataCell(Text('2023-10-03')), DataCell(Text('7')), DataCell(Text('5'))]),
                      DataRow(cells: [DataCell(Text('2023-10-04')), DataCell(Text('8')), DataCell(Text('6'))]),
                      DataRow(cells: [DataCell(Text('2023-10-05')), DataCell(Text('6')), DataCell(Text('4'))]),
                      DataRow(cells: [DataCell(Text('2023-10-06')), DataCell(Text('7')), DataCell(Text('5'))]),
                      DataRow(cells: [DataCell(Text('2023-10-07')), DataCell(Text('5')), DataCell(Text('3'))]),
                    ],
                  ),
                  SizedBox(height: 16.0),
                  Center(
                    child: Text(
                      'Spare Requests Status for Last 7 Days',
                      style: TextStyle(fontSize: 18.0, fontWeight: FontWeight.bold),
                    ),
                  ),
                  DataTable(
                    columns: [
                      DataColumn(label: Text('Date')),
                      DataColumn(label: Text('Open')),
                      DataColumn(label: Text('Closed')),
                    ],
                    rows: [
                      DataRow(cells: [DataCell(Text('2023-10-01')), DataCell(Text('4')), DataCell(Text('2'))]),
                      DataRow(cells: [DataCell(Text('2023-10-02')), DataCell(Text('5')), DataCell(Text('3'))]),
                      DataRow(cells: [DataCell(Text('2023-10-03')), DataCell(Text('6')), DataCell(Text('4'))]),
                      DataRow(cells: [DataCell(Text('2023-10-04')), DataCell(Text('7')), DataCell(Text('5'))]),
                      DataRow(cells: [DataCell(Text('2023-10-05')), DataCell(Text('5')), DataCell(Text('3'))]),
                      DataRow(cells: [DataCell(Text('2023-10-06')), DataCell(Text('6')), DataCell(Text('4'))]),
                      DataRow(cells: [DataCell(Text('2023-10-07')), DataCell(Text('4')), DataCell(Text('2'))]),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Helper class for chart data
class ChartData {
  final String x;
  final double y;

  ChartData(this.x, this.y);
}
