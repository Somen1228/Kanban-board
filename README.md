# Kanban Board 

This web-based project management tool is built using **React.js**, **Tailwind CSS**, **uuid**, and **React Icons**. It enables users to create and manage multiple boards for different projects, track tasks, and organize workflow efficiently. The tool allows users to add, edit, delete, and update tasks, assign priority levels, and mark tasks as completed. It also provides drag-and-drop functionality for moving tasks between different cards, enhancing the task management experience.

## Features

- **Multiple Boards**: Create and manage multiple boards to organize tasks for various projects.
- **Task Management**: Add, edit, delete, and update tasks within each board. Mark tasks as completed.
- **Priority Colors**: Assign color codes to cards to indicate priority levels.
- **Drag-and-Drop**: Intuitive drag-and-drop functionality for reorganizing tasks across different cards.
- **Search Functionality**: Search tasks within a board to quickly locate and manage tasks.
- **Persistent Storage**: Tasks and board data are stored in the browser’s local storage, ensuring data persistence across sessions.

## Usage

- **Create a New Board**: Click the "+ New Project" button in the sidebar to create a new board.
- **Add a Card**: Click on the "+ Add Card" button within a board to create a new card.
- **Add a Task**: Click on any card to open it, then click the "+ Add Task" button to add a new task.
- **Edit a Task**: Double-click on a task to modify its content.
- **Delete a Task**: Use the trash icon next to a task to delete it.
- **Mark a Task as Done**: Click on the check-circle icon to mark a task as completed.
- **Drag and Drop**: Drag tasks between cards to reorganize them as needed.
- **Filter by Color**: Use the color filter dropdown to filter and view tasks by priority.
- **Search Tasks**: Utilize the search bar to quickly locate tasks within the selected board.

## Components

- **CardsContext.jsx**: 
  - Manages the state and operations related to boards and cards.
  - Persists board and task data using local storage.
  
- **Board.jsx**:
  - Handles sidebar navigation, board creation, and deletion.
  - Implements task search functionality.
  
- **Cards.jsx**:
  - Renders the cards within each board.
  - Manages card creation, deletion, and task filtering by priority color.
  - Supports drag-and-drop for tasks.

- **Card.jsx**:
  - Displays individual tasks within a card.
  - Provides task creation, editing, deletion, and completion features.
  - Supports drag-and-drop task functionality within cards.


## Acknowledgements

- **Icons**: Provided by [React Icons](https://react-icons.github.io/react-icons/).
- **UUID Generation**: Powered by [uuid](https://www.npmjs.com/package/uuid).
