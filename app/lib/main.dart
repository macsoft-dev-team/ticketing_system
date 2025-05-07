import 'package:flutter/material.dart';
import 'screens/login_screen.dart'; // Import LoginScreen from the new location
import 'screens/home_screen.dart'; // Import HomeScreen

void main() {
  runApp(const CMSApp());
}

class CMSApp extends StatelessWidget {
  const CMSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ticketing System',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: LoginScreen(), // Show LoginScreen
      routes: {
        '/home': (context) => HomeScreen(), // Define your home screen route
      }
    );
  }
}
