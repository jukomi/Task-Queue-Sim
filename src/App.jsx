import React, { useState, useRef } from 'react';
import './App.css';

// Task Item Component (Square Box)
const TaskItem = ({ task }) => {
  const isHigh = task.priority === 'HIGH';
  return (
    <span className={`task-badge ${isHigh ? 'high-priority' : ''}`}>
      {task.duration}
    </span>
  );
};

// Queue Duration Component
const QueueDuration = ({ tasks }) => {
  const totalDuration = tasks.reduce((sum, task) => sum + task.duration, 0);
  const maxVisualCap = 300;
  const progressPercent = Math.min((totalDuration / maxVisualCap) * 100, 100);

  return (
    <div className="duration-container">
      <div className="duration-info">
        <strong>Duration:</strong> {totalDuration}
      </div>
      <div className="progress-track">
        <div
          className="progress-bar"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: totalDuration > 200 ? '#eab308' : '#22c55e'
          }}
        />
      </div>
    </div>
  );
};

// Reusable Service Queue Card
const ServiceQueue = ({ title, tasks, isHighPriority }) => {
  return (
    <div className={`queue-card ${isHighPriority ? 'high-priority' : ''}`}>
      <div className="queue-header">
        <h3>{title}</h3>
      </div>

      <div className="queue-section-label">Queue List:</div>
      <div className="task-list-area">
        {tasks.length === 0 ? (
          <span className="empty-msg" style={{ height: 'auto', justifyContent: 'flex-start' }}>
            Queue empty
          </span>
        ) : (
          tasks.map(task => <TaskItem key={task.id} task={task} />)
        )}
      </div>

      <QueueDuration tasks={tasks} />
    </div>
  );
};

// Main App Component
export default function App() {
  const [waitingTasks, setWaitingTasks] = useState([]);
  const [highPriorityQueue, setHighPriorityQueue] = useState([]);
  const [regularQueues, setRegularQueues] = useState([
    { id: 2, name: 'Regular Queue 2', tasks: [] },
    { id: 3, name: 'Regular Queue 3', tasks: [] },
    { id: 4, name: 'Regular Queue 4', tasks: [] }
  ]);

  const nextTaskId = useRef(1);

  const calculateQueueLoad = (tasks) => tasks.reduce((sum, t) => sum + t.duration, 0);

  const handleAddRandomTask = () => {
    const isHigh = Math.random() < 0.3;
    const newTask = {
      id: nextTaskId.current++,
      duration: Math.floor(Math.random() * 85) + 15,
      priority: isHigh ? 'HIGH' : 'REGULAR'
    };

    setWaitingTasks(prev => [...prev, newTask]);
  };

  const handleAdmitTask = () => {
    if (waitingTasks.length === 0) return;

    let selectedIndex = waitingTasks.findIndex(task => task.priority === 'HIGH');
    if (selectedIndex === -1) {
      selectedIndex = 0;
    }

    const taskToAdmit = waitingTasks[selectedIndex];
    setWaitingTasks(prev => prev.filter((_, idx) => idx !== selectedIndex));

    if (taskToAdmit.priority === 'HIGH') {
      setHighPriorityQueue(prev => [...prev, taskToAdmit]);
    } else {
      setRegularQueues(prevQueues => {
        let leastLoadedIndex = 0;
        let minLoad = calculateQueueLoad(prevQueues[0].tasks);

        for (let i = 1; i < prevQueues.length; i++) {
          const load = calculateQueueLoad(prevQueues[i].tasks);
          if (load < minLoad) {
            minLoad = load;
            leastLoadedIndex = i;
          }
        }

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
    <div className="app-container">
      <div className="app-content">
        <header className="app-header">
          <h1>Task Queue Simulator</h1>
          <p>React Built-in State Management & Priority Scheduling</p>
        </header>

        <div className="app-grid">
          {/* Left Column: Waiting Tasks Control Panel */}
          <div className="panel-card">
            <div className="button-group">
              <button className="btn btn-add" onClick={handleAddRandomTask}>
                + ADD RANDOM TASK
              </button>
              <button
                className="btn btn-admit"
                onClick={handleAdmitTask}
                disabled={waitingTasks.length === 0}
              >
                ADMIT TASK
              </button>
            </div>

            <div className="panel-header">
              <h2>Task Queue</h2>
            </div>

            <div className="waiting-box">
              {waitingTasks.length === 0 ? (
                <div className="empty-msg">
                  No tasks waiting. Click "ADD RANDOM TASK" to start.
                </div>
              ) : (
                waitingTasks.map(task => <TaskItem key={task.id} task={task} />)
              )}
            </div>
          </div>

          {/* Right Column: Processing Service Queues */}
          <div>
            <ServiceQueue
              title="High Priority Queue 1"
              tasks={highPriorityQueue}
              isHighPriority={true}
            />
            {regularQueues.map(queue => (
              <ServiceQueue
                key={queue.id}
                title={queue.name}
                tasks={queue.tasks}
                isHighPriority={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}