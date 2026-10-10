import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../chat/screens/conversations_screen.dart';
import '../communities/communities_screen.dart';
import '../feed/feed_screen.dart';
import '../notifications/notifications_screen.dart';
import '../profile/profile_screen.dart';

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    FeedScreen(),
    CommunitiesScreen(),
    NotificationsScreen(),
    ConversationsScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
          border: Border(
            top: BorderSide(
              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
              width: 0.5,
            ),
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, Icons.home_rounded, Icons.home_outlined, 'Feed'),
                _buildNavItem(1, Icons.group_rounded, Icons.group_outlined, 'Comunidades'),
                _buildNavItem(2, Icons.notifications_rounded, Icons.notifications_outlined, 'Alertas', hasBadge: true),
                _buildNavItem(3, Icons.chat_bubble_rounded, Icons.chat_bubble_outline_rounded, 'Mensagens', hasBadge: true),
                _buildNavItem(4, Icons.person_rounded, Icons.person_outline_rounded, 'Perfil'),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData selectedIcon, IconData unselectedIcon, String label, {bool hasBadge = false}) {
    final isSelected = _currentIndex == index;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final color = isSelected
        ? (isDark ? AppColors.darkLilac : AppColors.lilacPrimary)
        : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary);

    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  isSelected ? selectedIcon : unselectedIcon,
                  size: 24,
                  color: color,
                ),
                if (hasBadge && !isSelected)
                  Positioned(
                    top: -1,
                    right: -2,
                    child: Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFFFF453A),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
