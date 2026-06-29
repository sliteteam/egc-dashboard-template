# Data Contract

The dashboard reads one JSON object.

```json
{
  "generated_at": "2026-06-29T07:16:07.865Z",
  "source": "Your analytics source",
  "periods": ["7d", "30d", "90d", "180d", "all"],
  "total_followers": 12345,
  "team": {},
  "members": []
}
```

## Member Shape

Each member has profile fields plus `periods`.

```json
{
  "user_record_id": "user_1",
  "email": "ava@example.com",
  "name": "Ava Martin",
  "headline": "Founder",
  "followers_total": 12000,
  "slug": "ava",
  "photo": "photos/ava.svg",
  "periods": {
    "30d": {
      "posts": 8,
      "impressions": 42000,
      "likes": 390,
      "comments": 52,
      "reposts": 24,
      "engagements": 466,
      "eng_rate": 0.0111,
      "avg": {
        "impressions": 5250,
        "likes": 48.8,
        "comments": 6.5,
        "reposts": 3
      },
      "top_posts": []
    }
  }
}
```

## Top Posts

Top posts make the dashboard much better. They power the Top posts tab, trend
charts, race animation, and previous-period comparison chips.

```json
{
  "urn": "post_123",
  "url": "https://www.linkedin.com/feed/update/...",
  "posted_at": "2026-06-26T08:00:00.000Z",
  "impressions": 12000,
  "likes": 110,
  "comments": 18,
  "reposts": 7,
  "text": "Short public preview of the post"
}
```

Use public post URLs when possible. Avoid storing private notes or non-public
analytics unless the repository stays private.
