# Firebase Security Rules

This folder contains the security rules for Declutterly's Firebase services.

## Deployment

### Prerequisites
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase in this project: `firebase init`

### Deploy Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage

# Deploy both
firebase deploy --only firestore:rules,storage
```

## Files

- `firestore.rules` - Firestore database security rules
- `storage.rules` - Cloud Storage security rules

## Security Overview

### Firestore Rules
- **Users**: Only the authenticated owner can read/write their own data
- **Rooms**: Stored as subcollection under users, owner-only access
- **Challenges**: Creator controls, participants can read and update their progress
- **Shared Rooms**: Respects `isPublic` flag for visibility
- **Body Doubling Sessions**: Host controls, participants can join/leave
- **Connections**: Users can manage their own friend connections

### Storage Rules
- **User Files**: Only owner can read/write
- **Profile Pictures**: Readable by authenticated users (for social features)
- **Room Photos**: Owner-only access
- **File Limits**: Max 10MB per image, image content type required

## Testing Rules

Use the Firebase Emulator Suite to test rules locally:

```bash
firebase emulators:start --only firestore,storage
```

## Important Notes

1. **Always test rules in the emulator before deploying**
2. **Review rules after any data model changes**
3. **Monitor security rules coverage in Firebase Console**
4. **Set up Firebase App Check for additional protection**
