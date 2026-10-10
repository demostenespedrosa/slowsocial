class MomentoStory {
  final String id;
  final String? mediaUrl;
  final String? textNote;
  final int expiresInHours;
  final bool hasViewed;
  final DateTime createdAt;

  const MomentoStory({
    required this.id,
    this.mediaUrl,
    this.textNote,
    this.expiresInHours = 24,
    this.hasViewed = false,
    required this.createdAt,
  });

  factory MomentoStory.fromJson(Map<String, dynamic> json) {
    return MomentoStory(
      id: json['id'] ?? '',
      mediaUrl: json['media_url'],
      textNote: json['text_note'],
      expiresInHours: json['expires_in_hours'] ?? 24,
      hasViewed: json['has_viewed'] ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
    );
  }
}

class AuthorMomentosGroup {
  final String authorId;
  final String authorName;
  final String authorUsername;
  final String authorAvatar;
  final bool hasUnviewed;
  final List<MomentoStory> stories;

  const AuthorMomentosGroup({
    required this.authorId,
    required this.authorName,
    required this.authorUsername,
    required this.authorAvatar,
    required this.hasUnviewed,
    required this.stories,
  });

  factory AuthorMomentosGroup.fromJson(Map<String, dynamic> json) {
    List<MomentoStory> items = [];
    if (json['stories'] != null && json['stories'] is List) {
      items = (json['stories'] as List)
          .map((s) => MomentoStory.fromJson(s))
          .toList();
    }

    return AuthorMomentosGroup(
      authorId: json['author_id'] ?? '',
      authorName: json['author_name'] ?? '',
      authorUsername: json['author_username'] ?? '',
      authorAvatar: json['author_avatar'] ?? '',
      hasUnviewed: json['has_unviewed'] ?? false,
      stories: items,
    );
  }
}
