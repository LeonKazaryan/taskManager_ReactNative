# Description of the code and technologies used

## Overview

This is a Task Manager mobile app built for SalesAutomators internship assignment. The app allows users to create, manage, and track their tasks with features like status updates, date/time scheduling, and location tracking. It's designed to work offline-first with local data persistence.

## Tech Stack & Why I Chose These Technologies

### Frontend Framework

- **React Native with Expo**: I went with Expo because it's super beginner-friendly and lets me build cross-platform apps without dealing with native code complexity. The Expo Router makes navigation really clean and file-based routing is intuitive.

### State Management

- **Zustand**: I picked Zustand over Redux because it's way simpler and has less boilerplate. For a task manager app, I don't need complex state management, so Zustand's lightweight approach is perfect.
- **Immer**: Using Immer with Zustand makes state updates immutable and easier to reason about. No more worrying about accidentally mutating state.

### Data Persistence

- **AsyncStorage**: Since this is an offline-first app, I'm using AsyncStorage to persist tasks locally. It's simple, reliable, and perfect for storing JSON data on the device.

### Form Handling & Validation

- **React Hook Form**: This library makes form handling so much easier. Less re-renders, better performance, and cleaner code.
- **Zod**: For validation, Zod is awesome because it gives me TypeScript types automatically from my schemas. Type-safe validation without extra work.

### UI Components

- **React Native Paper**: I chose this over NativeWind because it gives me Material Design components out of the box. It's consistent, accessible, and looks professional without much custom styling.

### Date/Time Handling

- **@react-native-community/datetimepicker**: For date and time selection, this is the standard solution. Works well on both iOS and Android.

### Navigation

- **Expo Router**: File-based routing makes the app structure really clear. Each screen is just a file in the app directory, super intuitive.

### Development Tools

- **TypeScript**: Obviously using TypeScript for type safety. Makes debugging way easier and catches errors before runtime.
- **ESLint**: For code quality and consistency.
- **Jest**: For testing (though I haven't written many tests yet, still learning testing best practices).

## Key Features Implemented

1. **Task CRUD Operations**: Create, read, update, delete tasks
2. **Status Management**: Tasks can be todo, in-progress, completed, or cancelled
3. **Date/Time Scheduling**: Users can set when tasks should be done
4. **Location Tracking**: Manual location input (no GPS, just text)
5. **Sorting**: Sort by date added or by status
6. **Offline Storage**: All data persists locally using AsyncStorage

This project taught me a lot about React Native development, state management patterns, and mobile app architecture. The offline-first approach was interesting to implement and really makes the app feel responsive.
# Description of the code and technologies used

## Overview

This is a Task Manager mobile app built for SalesAutomators internship assignment. The app allows users to create, manage, and track their tasks with features like status updates, date/time scheduling, and location tracking. It's designed to work offline-first with local data persistence.

## Tech Stack & Why I Chose These Technologies

### Frontend Framework

- **React Native with Expo**: I went with Expo because it's super beginner-friendly and lets me build cross-platform apps without dealing with native code complexity. The Expo Router makes navigation really clean and file-based routing is intuitive.

### State Management

- **Zustand**: I picked Zustand over Redux because it's way simpler and has less boilerplate. For a task manager app, I don't need complex state management, so Zustand's lightweight approach is perfect.
- **Immer**: Using Immer with Zustand makes state updates immutable and easier to reason about. No more worrying about accidentally mutating state.

### Data Persistence

- **AsyncStorage**: Since this is an offline-first app, I'm using AsyncStorage to persist tasks locally. It's simple, reliable, and perfect for storing JSON data on the device.

### Form Handling & Validation

- **React Hook Form**: This library makes form handling so much easier. Less re-renders, better performance, and cleaner code.
- **Zod**: For validation, Zod is awesome because it gives me TypeScript types automatically from my schemas. Type-safe validation without extra work.

### UI Components

- **React Native Paper**: I chose this over NativeWind because it gives me Material Design components out of the box. It's consistent, accessible, and looks professional without much custom styling.

### Date/Time Handling

- **@react-native-community/datetimepicker**: For date and time selection, this is the standard solution. Works well on both iOS and Android.

### Navigation

- **Expo Router**: File-based routing makes the app structure really clear. Each screen is just a file in the app directory, super intuitive.

### Development Tools

- **TypeScript**: Obviously using TypeScript for type safety. Makes debugging way easier and catches errors before runtime.
- **ESLint**: For code quality and consistency.
- **Jest**: For testing (though I haven't written many tests yet, still learning testing best practices).

## Key Features Implemented

1. **Task CRUD Operations**: Create, read, update, delete tasks
2. **Status Management**: Tasks can be todo, in-progress, completed, or cancelled
3. **Date/Time Scheduling**: Users can set when tasks should be done
4. **Location Tracking**: Manual location input (no GPS, just text)
5. **Sorting**: Sort by date added or by status
6. **Offline Storage**: All data persists locally using AsyncStorage

This project taught me a lot about React Native development, state management patterns, and mobile app architecture. The offline-first approach was interesting to implement and really makes the app feel responsive.
