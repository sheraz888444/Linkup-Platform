# Instagram-like Features Implementation Plan

## Database Schema Updates
- [ ] Add new fields to users table: address, gender, dateOfBirth, phoneNumber, otherLinks
- [ ] Add stories table for temporary content
- [ ] Add postType field to posts table to distinguish reels from regular posts

## Backend API Updates
- [ ] Update user profile update endpoint to handle new fields
- [ ] Add stories CRUD endpoints
- [ ] Add reels-specific endpoints if needed
- [ ] Update storage methods for new features

## Profile Enhancement
- [ ] Update profile.tsx to include new editable fields (address, gender, DOB, phone, links)
- [ ] Add profile links display section
- [ ] Improve profile UI layout to be more Instagram-like
- [ ] Add profile statistics (posts count, followers, following)

## Followers/Following System
- [ ] Implement followers/following UI in friends.tsx
- [ ] Add follow/unfollow buttons on user profiles
- [ ] Create followers and following lists pages
- [ ] Add follow status checking and updating

## Reels Functionality
- [ ] Update videos.tsx to display reels feed
- [ ] Modify create-post.tsx to support reel creation
- [ ] Add reel-specific UI (vertical video player, etc.)
- [ ] Implement reel discovery and trending

## Stories Feature
- [ ] Create stories creation component
- [ ] Add stories viewer component
- [ ] Implement stories expiration (24 hours)
- [ ] Add stories to profile and home feed

## UI Improvements
- [ ] Update overall design to match Instagram aesthetics
- [ ] Improve navigation and layout
- [ ] Add dark mode support throughout
- [ ] Enhance mobile responsiveness

## Testing and Polish
- [ ] Test all new features end-to-end
- [ ] Add loading states and error handling
- [ ] Optimize performance for media-heavy content
- [ ] Add proper validation for new fields
