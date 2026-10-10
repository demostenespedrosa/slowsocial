class Post {
  final String id;
  final String authorId;
  final String authorName;
  final String authorUsername;
  final String authorAvatar;
  final String authorHeadline;
  final String content;
  final String formatType;
  final List<String> mediaUrls;
  final String aspectRatio;
  final int reactionsCount;
  final int responsesCount;
  final int savedCount;
  final String? userReaction;
  final DateTime createdAt;

  const Post({
    required this.id,
    required this.authorId,
    required this.authorName,
    required this.authorUsername,
    required this.authorAvatar,
    required this.authorHeadline,
    required this.content,
    this.formatType = 'thought',
    this.mediaUrls = const [],
    this.aspectRatio = '16:9',
    this.reactionsCount = 0,
    this.responsesCount = 0,
    this.savedCount = 0,
    this.userReaction,
    required this.createdAt,
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    List<String> media = [];
    if (json['media_urls'] != null) {
      if (json['media_urls'] is List) {
        media = List<String>.from(json['media_urls']);
      }
    }

    return Post(
      id: json['id'] ?? '',
      authorId: json['author_id'] ?? '',
      authorName: json['author_name'] ?? '',
      authorUsername: json['author_username'] ?? '',
      authorAvatar: json['author_avatar'] ?? '',
      authorHeadline: json['author_headline'] ?? '',
      content: json['content'] ?? '',
      formatType: json['format_type'] ?? 'thought',
      mediaUrls: media,
      aspectRatio: json['aspect_ratio'] ?? '16:9',
      reactionsCount: json['reactions_count'] ?? 0,
      responsesCount: json['responses_count'] ?? 0,
      savedCount: json['saved_count'] ?? 0,
      userReaction: json['user_reaction'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
    );
  }
}
