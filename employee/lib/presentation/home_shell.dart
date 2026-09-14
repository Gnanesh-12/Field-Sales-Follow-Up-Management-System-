import 'package:flutter/material.dart';
import 'app_theme.dart';
import 'dashboard_page.dart';
import 'pages/visits_page.dart';
import 'pages/follow_ups_page.dart';
import 'pages/profile_page.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _selectedIndex = 0;

  final List<Widget> _pages = const [
    DashboardPage(),
    VisitsPage(),
    FollowUpsPage(),
    ProfilePage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.backgroundColor,
      body: IndexedStack(
        index: _selectedIndex,
        children: _pages,
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: context.surfaceColor,
        border: Border(
          top: BorderSide(color: context.borderSubtleColor),
        ),
      ),
      child: SafeArea(
        child: NavigationBar(
          selectedIndex: _selectedIndex,
          onDestinationSelected: (index) => setState(() => _selectedIndex = index),
          backgroundColor: context.surfaceColor,
          elevation: 0,
          indicatorColor: Colors.black.withValues(alpha: 0.05),
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: [
            NavigationDestination(
              icon: const Icon(Icons.dashboard_outlined),
              selectedIcon: Icon(Icons.dashboard_rounded, color: context.accentColor),
              label: 'Today',
            ),
            NavigationDestination(
              icon: const Icon(Icons.map_outlined),
              selectedIcon: Icon(Icons.map_rounded, color: context.accentColor),
              label: 'Visits',
            ),
            NavigationDestination(
              icon: const Icon(Icons.pending_actions_outlined),
              selectedIcon: Icon(Icons.pending_actions_rounded, color: context.accentColor),
              label: 'Follow-ups',
            ),
            NavigationDestination(
              icon: const Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person_rounded, color: context.accentColor),
              label: 'Profile',
            ),
          ],

        ),
      ),
    );
  }
}
