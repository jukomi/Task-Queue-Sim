import React, { useState, useRef } from 'react';

// Sub-component for individual Task item display
const TaskItem = ({ task }) => {
  const isHigh = task.priority === 'HIGH';
  const itemStyle = {
    display: 'inline-block',
    padding: '4px 8px',
    margin: '2px',
    border: isHigh ? '2px solid red' : '1px solid #ccc',
    color: isHigh ? 'red' : 'black',
    fontWeight: isHigh ? 'bold' : 'normal',
    backgroundColor: '#fff',
    borderRadius: '4px'
  };

  return <span style={itemStyle}>{task.duration}</span>;
};

// Component to calculate & display derived queue duration
const QueueDuration = ({ tasks }) => {
  // Derived state: calculate total load on demand using reduce
  const totalDuration = tasks.reduce((sum, task) => sum + task.duration, 0);

  return (
    <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>
      <strong>Duration:</strong> {totalDuration}
      {/* Simple visual indicator bar */}
      <div
        style={{
          height: '6px',
          width: `${Math.min(totalDuration, 300)}px`,
          backgroundColor: '#4caf50',
          marginTop: '4px',
          transition: 'width 0.3s ease'
        }}
      />
    </div>
  );
};

// Reusable Service Queue display component
const ServiceQueue = ({ title, tasks }) => {
  return (
    <div style={{ border: '1px solid #999', padding: '12px', marginBottom: '12px', minHeight: '100px' }}>
      <h3>{title}</h3>
      <div style={{ minHeight: '30px' }}>
        <strong>Queue List:</strong>
        <div>
          {tasks.map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </div>
      <QueueDuration tasks={tasks} />
    </div>
  );
};

// Main Application Component owning state
export default function TaskQueueSimulator() {
  // State 1: Unadmitted waiting queue
  const [waitingTasks, setWaitingTasks] = useState([]);

  // State 2: High Priority Queue 1
  const [highPriorityQueue, setHighPriorityQueue] = useState([]);

  // State 3: Regular Processing Queues (Queues 2, 3, 4)
  const [regularQueues, setRegularQueues] = useState([
    { id: 2, name: 'Regular Queue 2', tasks: [] },
    { id: 3, name: 'Regular Queue 3', tasks: [] },
    { id: 4, name: 'Regular Queue 4', tasks: [] }
  ]);

  // Ref to preserve unique task IDs across re-renders
  const nextTaskId = useRef(1);

  // Helper: Calculate total load/duration of a task array
  const calculateQueueLoad = (tasks) => tasks.reduce((sum, t) => sum + t.duration, 0);

  // Handler: Add a new random task immutably
  const handleAddRandomTask = () => {
    const isHigh = Math.random() < 0.3; // ~30% chance for HIGH priority
    const newTask = {
      id: nextTaskId.current++,
      duration: Math.floor(Math.random() * 90) + 10, // Random duration 10–99
      priority: isHigh ? 'HIGH' : 'REGULAR'
    };

    // Functional immutable state update
    setWaitingTasks(prevTasks => [...prevTasks, newTask]);
  };

  // Handler: Select and admit next eligible task
  const handleAdmitTask = () => {
    if (waitingTasks.length === 0) return;

    // Step 1: Find earliest HIGH task index; if none, take earliest REGULAR task (index 0)
    let selectedIndex = waitingTasks.findIndex(task => task.priority === 'HIGH');
    if (selectedIndex === -1) {
      selectedIndex = 0; // FIFO for regular task at head
    }

    const taskToAdmit = waitingTasks[selectedIndex];

    // Step 2: Remove ONLY the admitted task immutably
    setWaitingTasks(prevTasks => prevTasks.filter((_, idx) => idx !== selectedIndex));

    // Step 3: Dispatch task based on priority
    if (taskToAdmit.priority === 'HIGH') {
      // Append to High Priority Queue 1
      setHighPriorityQueue(prevQueue => [...prevQueue, taskToAdmit]);
    } else {
      // Dispatch REGULAR task to the least-loaded regular queue
      setRegularQueues(prevQueues => {
        let leastLoadedIndex = 0;
        let minLoad = calculateQueueLoad(prevQueues[0].tasks);

        // Find queue with smallest total duration (tie-breaker favors lower queue number)
        for (let i = 1; i < prevQueues.length; i++) {
          const load = calculateQueueLoad(prevQueues[i].tasks);
          if (load < minLoad) {
            minLoad = load;
            leastLoadedIndex = i;
          }
        }

        // Return new array with immutable updates to selected queue
        return prevQueues.map((q, idx) => {
          if (idx === leastLoadedIndex) {
            return { ...q, tasks: [...q.tasks, taskToAdmit] };
          }
          return q;
        });
      });
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', padding: '20px', fontFamily: 'sans-serif' }}>
      {/* Left Column: Controls and Waiting Queue */}
      <div style={{ flex: '1' }}>
        <button
          onClick={handleAddRandomTask}
          style={{ padding: '8px 16px', backgroundColor: '#1976d2', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: '12px' }}
        >
          ADD RANDOM TASK
        </button>

        <h2>Task Queue</h2>
        <div style={{ border: '1px solid #ccc', padding: '12px', minHeight: '60px', marginBottom: '12px' }}>
          {waitingTasks.length === 0 ? (
            <span style={{ color: '#888' }}>No waiting tasks</span>
          ) : (
            waitingTasks.map(task => <TaskItem key={task.id} task={task} />)
          )}
        </div>

        <button
          onClick={handleAdmitTask}
          style={{ padding: '8px 16px', backgroundColor: '#1976d2', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          ADMIT TASK
        </button>
      </div>

      {/* Right Column: High Priority Queue & Regular Service Queues */}
      <div style={{ flex: '1.5' }}>
        <ServiceQueue title="High Priority Queue 1" tasks={highPriorityQueue} />
        {regularQueues.map(queue => (
          <ServiceQueue key={queue.id} title={queue.name} tasks={queue.tasks} />
        ))}
      </div>
    </div>
  );
}