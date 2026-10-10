class User {
  final String id;
  final String name;
  final String username;
  final String avatar;
  final String headline;
  final String? bio;
  final int degreeLevel;
  final String? pronouns;

  const User({
    required this.id,
    required this.name,
    required this.username,
    required this.avatar,
    required this.headline,
    this.bio,
    this.degreeLevel = 1,
    this.pronouns,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      name: json['full_name'] ?? json['name'] ?? '',
      username: json['username'] ?? '',
      avatar: json['avatar_url'] ?? json['avatar'] ?? '',
      headline: json['headline'] ?? '',
      bio: json['bio'],
      degreeLevel: json['degree_level'] ?? 1,
      pronouns: json['pronouns'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': name,
      'username': username,
      'avatar_url': avatar,
      'headline': headline,
      'bio': bio,
      'degree_level': degreeLevel,
      'pronouns': pronouns,
    };
  }
}
