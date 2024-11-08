import { useState, useRef, useEffect } from 'react';
import Pin from './components/Pin';
import Comment from './components/Comment';

function App() {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [pins, setPins] = useState([]);
  const [selectedPinId, setSelectedPinId] = useState(null);
  const [isSingleView, setIsSingleView] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
  const pinRefs = useRef({});
  const image1Ref = useRef(null); // Reference for the first image

  useEffect(() => {
    const fetchPins = async () => {
      const response = await fetch('http://localhost:3000/pins');
      const fetchedPins = await response.json();
      setPins(fetchedPins);
    };
    fetchPins();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      console.log('Window resized, updating pin positions...');
      // Logic to update pin positions based on new image dimensions
      setPins(prevPins => prevPins.map(pin => ({
        ...pin,
        x: pin.x, // Keep the same percentage
        y: pin.y, // Keep the same percentage
      })));
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleImageUpload = (e, setImage) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLeftImageClick = async (e) => {
    if (!image1) return;

    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; // Store as percentage
    const y = ((e.clientY - rect.top) / rect.height) * 100; // Store as percentage

    const newPin = {
      x,
      y,
      comments: [],
      files: [],
      completed: false,
      pinNumber: pins.length + 1 // Assign pin number based on current length of pins
    };

    try {
      const response = await fetch('http://localhost:3000/pins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPin),
      });

      if (!response.ok) {
        throw new Error('Failed to create pin');
      }

      const createdPin = await response.json(); // Get the created pin from the response
      setPins([...pins, createdPin]); // Add the created pin to the state
      setSelectedPinId(createdPin.id);
    } catch (error) {
      console.error('Error adding pin:', error);
    }
  };

  const handlePinUpdate = async (pinId, updates) => {
    await fetch(`http://localhost:3000/pins/${pinId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    setPins(pins.map(pin => 
      pin.id === pinId 
        ? { ...pin, ...updates }
        : pin
    ));
  };

  const handlePinDelete = async (pinId) => {
    await fetch(`http://localhost:3000/pins/${pinId}`, {
      method: 'DELETE',
    });
    setPins(pins.filter(pin => pin.id !== pinId));
    setSelectedPinId(null);
  };

  const handleCommentDelete = (pinId, commentIndex) => {
    const updatedPins = pins.map(pin => {
      if (pin.id === pinId) {
        const updatedComments = pin.comments.filter((_, index) => index !== commentIndex);
        return { ...pin, comments: updatedComments };
      }
      return pin;
    });
    setPins(updatedPins);
  };

  const handleReply = (pinId, replyText) => {
    const updatedPins = pins.map(pin => {
      if (pin.id === pinId) {
        const updatedComments = [...pin.comments, { text: replyText, replies: [] }];
        return { ...pin, comments: updatedComments };
      }
      return pin;
    });
    setPins(updatedPins);
  };

  const handlePinSelect = (pinId) => {
    setSelectedPinId(pinId === selectedPinId ? null : pinId);
    
    if (pinId !== selectedPinId && pinRefs.current[pinId]) {
      const container = document.querySelector('.main-scroll-container');
      const pinElement = pinRefs.current[pinId];
      const containerRect = container.getBoundingClientRect();
      const pinRect = pinElement.getBoundingClientRect();
      
      if (pinRect.top < containerRect.top || pinRect.bottom > containerRect.bottom) {
        pinElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  };

  const togglePinCompletion = (pinId) => {
    handlePinUpdate(pinId, { completed: !pins.find(pin => pin.id === pinId).completed });
  };

  const getCommentCount = (pin) => {
    return pin.comments.reduce((total, comment) => 
      total + 1 + (comment.replies?.length || 0), 0
    );
  };

  const filteredPins = pins.filter(pin => 
    activeTab === 'active' ? !pin.completed : pin.completed
  );

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col h-screen">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">QA Annotations</h2>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-2 text-sm font-medium ${
                activeTab === 'active'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2 text-sm font-medium ${
                activeTab === 'completed'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-6">
            {filteredPins.map((pin) => (
              <div
                key={pin.id}
                className={`bg-gray-50 rounded-lg border ${
                  pin.id === selectedPinId ? 'border-blue-500' : 'border-gray-200'
                } overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors duration-200`}
                onClick={() => handlePinSelect(pin.id)}
              >
                <div className="p-4">
                  <div className="mb-2 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">
                      Pin #{pin.pinNumber} {/* Display pin number */}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {getCommentCount(pin)} comment{getCommentCount(pin) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {pin.comments.length > 0 && (
                    <div>
                      {pin.comments.map((comment, index) => (
                        <Comment
                          key={index}
                          comment={comment}
                          onReply={replyText => handleReply(pin.id, replyText)} // Pass reply handler
                          onDelete={() => handleCommentDelete(pin.id, index)} // Pass delete handler
                        />
                      ))}
                    </div>
                  )}
                  {pin.files.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500">
                        Attachments: {pin.files.length}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredPins.length === 0 && (
              <p className="text-gray-500 text-sm">
                {activeTab === 'active' 
                  ? 'Click on the left screenshot to add annotations'
                  : 'No completed threads yet'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen">
        <div className="p-6 bg-white border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Screenshot Comparison Tool
            </h1>
            <button
              onClick={() => setIsSingleView(!isSingleView)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              {isSingleView ? 'Show Both' : 'Single View'}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto main-scroll-container">
          <div className="flex min-h-full">
            {/* First Image Upload */}
            <div className={`${isSingleView ? 'w-full' : 'w-1/2'} p-6 ${!isSingleView && 'border-r'} border-gray-200`}>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">First Screenshot</h2>
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setImage1)}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  {image1 && (
                    <div className="mt-4 relative">
                      <div className="relative inline-block min-w-full">
                        <img
                          src={image1}
                          alt="First screenshot"
                          className="w-full h-auto rounded border border-gray-200"
                          onClick={handleLeftImageClick}
                        />
                        {pins.map(pin => (
                          <Pin
                            key={pin.id}
                            ref={el => pinRefs.current[pin.id] = el}
                            x={`${pin.x}%`} // Use percentage for positioning
                            y={`${pin.y}%`} // Use percentage for positioning
                            comments={pin.comments}
                            files={pin.files}
                            completed={pin.completed}
                            isSelected={pin.id === selectedPinId}
                            onClick={() => handlePinSelect(pin.id)}
                            onDelete={() => handlePinDelete(pin.id)}
                            onUpdate={(updates) => handlePinUpdate(pin.id, updates)}
                            onToggleComplete={() => togglePinCompletion(pin.id)}
                            pinNumber={pin.pinNumber} // Pass pin number to Pin component
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Second Image Upload */}
            {!isSingleView && (
              <div className="w-1/2 p-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold mb-4">Second Screenshot</h2>
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setImage2)}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                    {image2 && (
                      <div className="mt-4">
                        <div className="relative inline-block min-w-full">
                          <img
                            src={image2}
                            alt="Second screenshot"
                            className="w-full h-auto rounded border border-gray-200"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {!image1 && !image2 && (
            <div className="text-sm text-gray-500 text-center p-6">
              Upload two screenshots to compare them
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
