# FastAPI Server Setup

This is a FastAPI server application. Below are the steps to set up and run the server.

## Prerequisites

- Python
- `pip` (Python package installer)

## Setup

1. Clone the repository and navigate to your project folder:

    ```bash
    git clone https://github.com/mbirnhak/software-engineer-2-assessment.git
    cd software-engineer-2-assessment/api-server
    ```

2. Create a virtual environment (if you haven't already):

    ```bash
    python3 -m venv venv
    ```

3. Activate the virtual environment:

    - On macOS/Linux:

        ```bash
        source venv/bin/activate
        ```

    - On Windows:

        ```bash
        venv\Scripts\activate
        ```

4. Install the required dependencies:

    ```bash
    pip install -r requirements.txt
    ```

## Running the Server

1. Make sure you're in the same directory as `server.py`.

2. Start the FastAPI server using Uvicorn:

    ```bash
    uvicorn server:app --reload
    ```

    - `server`: Refers to the Python file `server.py` (without the `.py` extension).
    - `app`: Refers to the FastAPI app object created in `server.py`.

3. The server should now be running. You can access the API at `http://127.0.0.1:8000`.

## Endpoints

Once the server is running, you can test the available API endpoints through the UI.

## Stopping the Server

To stop the server, press `Ctrl+C` in the terminal where the server is running.