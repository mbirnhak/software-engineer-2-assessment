import { useState, useEffect, useRef } from 'react'
import './App.css'

interface Message {
  id: number
  content: string
  order: number
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState<string>("")
  const [error, setError] = useState<boolean>(false)
  // Added these new state variables for message moving
  const [movingMessageId, setMovingMessageId] = useState<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Welcome!
  // Edit the below functions to make the application functional.
  // Remember, updates to messages must be persisted across page refreshes.
  // That means syncing the order of messages, new messages, etc. with
  // the api server after every operation.
  // Finally, you should not need to make any changes to the rendering/styling
  // of the application.
  const apiUrl = "http://localhost:8000/messages"

  useEffect(() => {
    // Fetch the initial message list from the api server and set the messages state (sorted by order)
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        const sortedData = data.sort((a: Message, b: Message) => a.order - b.order)
        setMessages(sortedData)
        console.log("Fetched messages:", data)
      })
      .catch(error => {
        console.error('Error fetching messages:', error)
      })
    // Cleanup function to clear any pending timeouts
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // This function is called when the user submits a new message.
  // It sends a POST request to the api server with the new message and updates the messages state.
  const submitMessage = () => {
    if (message.trim() === "") {
      setError(true)
      return
    }
    console.log("submitMessage", message)
    setError(false)
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          content: message,
          order: messages.length,
        })
    }).then(response => {
      if (response.ok) {
        return response.json()
      } else {
        throw new Error('Network response was not ok')
      }
    }
    ).then(data => {
      setMessages(messages => [...messages, data])
      setMessage("")
    }
    ).catch(error => {
      console.error('Error submitting message:', error)
    }
    )
  }

  // This function is called when the user clicks the delete button for a message.
  // It sends a DELETE request to the api server and updates the messages state.
  // It also updates the order of the remaining messages.
  const deleteMessage = (id: number) => {
    fetch(`${apiUrl}/${id}`, {
      method: 'DELETE'
    }).then(response => {
      if (response.ok) {
        return response.json()
      } else {
        throw new Error('Network response was not ok')
      }
    }
    ).then((deleted_message: Message) => {
      const deletedOrder = deleted_message.order;
      // Filter out the deleted message
      const updatedMessages = messages
        .filter(msg => msg.id !== deleted_message.id)
        .sort((a, b) => a.order - b.order);
      const changedMessages: Message[] = [];
      // Only update the order of the messages with order > deleted messages order
      const reordered = updatedMessages.map((msg) => {
        if (msg.order > deletedOrder) {
          changedMessages.push(msg);
          return { ...msg, order: msg.order - 1 };
        }
        return msg;
      });
      setMessages(reordered);

      // Sync the new order with the server
      changedMessages.forEach((msg: Message) => {
        fetch(`${apiUrl}/${msg.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order: msg.order - 1,
            content: messages.find(m => m.id === msg.id)?.content
          })
        }).then(response => {
          if (!response.ok) {
            throw new Error('Failed to update message order');
          }
        }).catch(error => {
          console.error('Error updating message order:', error);
        });
      });
    }
    ).catch(error => {
      console.error('Error deleting message:', error)
    }
    )
  }

  // Added this helper function for moving messages (for animation purposes)
  const setMovingMessage = (id: number) => {
    // Clear any existing timeout
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }

    // Set the moving message ID
    setMovingMessageId(id)

    // Clear the moving message ID after animation completes
    timeoutRef.current = window.setTimeout(() => {
      setMovingMessageId(null)
    }, 600)
  }

  // This function is called when the user clicks the up button for a message.
  // It sends a PUT request to the api server to update the order of the message
  // and the message before it, and updates the messages state.
  const moveMessageUp = async (id: number) => {
    // Find the message and its order
    const message = messages.find(msg => msg.id === id);
    const messageOrder = message?.order;

    // Early return if message not found or is already at the top
    if (messageOrder === undefined || messageOrder === 0) {
      return;
    }

    // Find the message before the one we want to move
    const messageBefore = messages.find(msg => msg.order === messageOrder - 1);

    if (!messageBefore) {
      return; // Safety check: there should be a message before, but just in case
    }

    // Set moving animation state
    setMovingMessage(id)

    try {
      // First API call - move the target message up
      const response1 = await fetch(`${apiUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: messageOrder - 1,
          content: message?.content
        })
      });

      if (!response1.ok) {
        throw new Error('Failed to update first message');
      }

      const updatedMessage1 = await response1.json();

      // Second API call - move the other message down
      const response2 = await fetch(`${apiUrl}/${messageBefore.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          {
            order: messageOrder,
            content: messageBefore.content
          })
      });

      if (!response2.ok) {
        throw new Error('Failed to update second message');
      }

      const updatedMessage2 = await response2.json();

      // Update the state with both changes at once
      const updatedMessages = messages.map(msg => {
        if (msg.id === updatedMessage1.id) {
          return { ...msg, order: updatedMessage1.order };
        }
        if (msg.id === updatedMessage2.id) {
          return { ...msg, order: updatedMessage2.order };
        }
        return msg;
      });

      setMessages(
        [...updatedMessages].sort((a, b) => a.order - b.order)
      );

    } catch (error) {
      console.error('Error moving message up:', error);
    }
  };

  // This function is called when the user clicks the down button for a message.
  // It sends a PUT request to the api server to update the order of the message
  // and the message after it, and updates the messages state.
  const moveMessageDown = async (id: number) => {
    // Find the message and its order
    const message = messages.find(msg => msg.id === id);
    const messageOrder = message?.order;

    // Early return if message not found or is already at the bottom
    if (messageOrder === undefined || messageOrder === messages.length - 1) {
      return;
    }

    // Find the message after the one we want to move
    const messageAfter = messages.find(msg => msg.order === messageOrder + 1);

    if (!messageAfter) {
      return; // Safety check: there should be a message after, but just in case
    }

    // Set moving animation state
    setMovingMessage(id)

    try {
      // First API call - move the target message down
      const response1 = await fetch(`${apiUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: messageOrder + 1,
          content: message?.content
        })
      });

      if (!response1.ok) {
        throw new Error('Failed to update first message');
      }

      const updatedMessage1 = await response1.json();

      // Second API call - move the other message up
      const response2 = await fetch(`${apiUrl}/${messageAfter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: messageOrder,
          content: messageAfter.content
        })
      });

      if (!response2.ok) {
        throw new Error('Failed to update second message');
      }

      const updatedMessage2 = await response2.json();

      // Update the state with both changes at once
      const updatedMessages = messages.map((msg: Message) => {
        if (msg.id === updatedMessage1.id) {
          return { ...msg, order: updatedMessage1.order };
        }
        if (msg.id === updatedMessage2.id) {
          return { ...msg, order: updatedMessage2.order };
        }
        return msg;
      });

      setMessages(
        [...updatedMessages].sort((a, b) => a.order - b.order)
      );

    } catch (error) {
      console.error('Error moving message down:', error);
    }
  };

  return (
    <div className="container">
      <div className="messages">
        <h3>Messages</h3>
        <ol>
          {messages.map(msg => (
            <li className={`message ${movingMessageId === msg.id ? 'message-moving' : ''}`} 
              key={msg.id}
            >
              <div className="button-group">
                <button onClick={() => deleteMessage(msg.id)}>❌</button>
                <div className="button-column-group">
                  <button onClick={() => moveMessageUp(msg.id)}>🔼</button>
                  <button onClick={() => moveMessageDown(msg.id)}>🔽</button>
                </div>
              </div>
              {msg.content}
            </li>
          ))}
        </ol>
      </div>
      <div className="form">
        <h3>Submit a new message</h3>
        <div className="input-group">
          <input value={message} onChange={(e) => setMessage(e.target.value)} />
          <button onClick={submitMessage}>submit</button>
          <p style={{ color: "hotPink", visibility: error ? "visible" : "hidden" }}>Message can not be empty</p>
        </div>
      </div>
    </div>
  )
}

export default App
