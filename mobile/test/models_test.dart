import 'package:flutter_test/flutter_test.dart';
import 'package:slowsocial/core/models/user.dart';
import 'package:slowsocial/core/models/post.dart';
import 'package:slowsocial/core/models/momento.dart';

void main() {
  group('User Model Tests', () {
    test('User.fromJson correctly parses standard payload', () {
      final json = {
        'id': 'usr_1',
        'full_name': 'Demóstenes Pedrosa',
        'username': 'demostenes',
        'avatar_url': 'https://slowsocial.app/avatar.png',
        'headline': 'Building SlowSocial',
        'bio': 'Calm computing advocate',
        'degree_level': 1,
        'pronouns': 'he/him',
      };

      final user = User.fromJson(json);

      expect(user.id, 'usr_1');
      expect(user.name, 'Demóstenes Pedrosa');
      expect(user.username, 'demostenes');
      expect(user.avatar, 'https://slowsocial.app/avatar.png');
      expect(user.headline, 'Building SlowSocial');
      expect(user.bio, 'Calm computing advocate');
      expect(user.degreeLevel, 1);
      expect(user.pronouns, 'he/him');
    });

    test('User.toJson outputs expected keys', () {
      const user = User(
        id: 'usr_2',
        name: 'Alice Santos',
        username: 'alice',
        avatar: 'https://slowsocial.app/alice.png',
        headline: 'Designer',
      );

      final map = user.toJson();
      expect(map['id'], 'usr_2');
      expect(map['full_name'], 'Alice Santos');
      expect(map['username'], 'alice');
      expect(map['degree_level'], 1);
    });
  });

  group('Post Model Tests', () {
    test('Post.fromJson parses correctly with media list and counts', () {
      final json = {
        'id': 'post_1',
        'author_id': 'usr_1',
        'author_name': 'Demóstenes',
        'author_username': 'demostenes',
        'author_avatar': 'https://slowsocial.app/avatar.png',
        'author_headline': 'Architect',
        'content': 'Redescobrindo a serenidade na web.',
        'format_type': 'thought',
        'media_urls': ['https://media.slowsocial.app/photo1.jpg'],
        'aspect_ratio': '16:9',
        'reactions_count': 12,
        'responses_count': 3,
        'saved_count': 5,
        'user_reaction': 'deep_thought',
        'created_at': '2026-10-09T18:00:00Z',
      };

      final post = Post.fromJson(json);

      expect(post.id, 'post_1');
      expect(post.authorName, 'Demóstenes');
      expect(post.reactionsCount, 12);
      expect(post.responsesCount, 3);
      expect(post.savedCount, 5);
      expect(post.userReaction, 'deep_thought');
      expect(post.mediaUrls.length, 1);
      expect(post.mediaUrls.first, 'https://media.slowsocial.app/photo1.jpg');
    });

    test('Post.fromJson defaults empty mediaUrls when null', () {
      final json = {
        'id': 'post_2',
        'author_id': 'usr_2',
        'author_name': 'Alice',
        'author_username': 'alice',
        'author_avatar': '',
        'author_headline': '',
        'content': 'Pensamento sem mídia.',
      };

      final post = Post.fromJson(json);
      expect(post.mediaUrls, isEmpty);
      expect(post.reactionsCount, 0);
      expect(post.formatType, 'thought');
    });
  });

  group('Momento Model Tests', () {
    test('MomentoStory and AuthorMomentosGroup parse properly', () {
      final json = {
        'author_id': 'usr_alice',
        'author_name': 'Alice Santos',
        'author_username': 'alice',
        'author_avatar': 'https://slowsocial.app/alice.png',
        'has_unviewed': true,
        'stories': [
          {
            'id': 'story_1',
            'media_url': 'https://media.slowsocial.app/story1.jpg',
            'text_note': 'Café da manhã calmo ☕',
            'expires_in_hours': 24,
            'has_viewed': false,
            'created_at': '2026-10-09T08:00:00Z',
          },
          {
            'id': 'story_2',
            'media_url': 'https://media.slowsocial.app/story2.jpg',
            'text_note': null,
            'expires_in_hours': 24,
            'has_viewed': true,
            'created_at': '2026-10-09T10:00:00Z',
          }
        ]
      };

      final group = AuthorMomentosGroup.fromJson(json);

      expect(group.authorId, 'usr_alice');
      expect(group.authorName, 'Alice Santos');
      expect(group.hasUnviewed, isTrue);
      expect(group.stories.length, 2);
      expect(group.stories[0].textNote, 'Café da manhã calmo ☕');
      expect(group.stories[0].hasViewed, isFalse);
      expect(group.stories[1].hasViewed, isTrue);
    });
  });
}
