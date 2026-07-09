"""
Test Movivid with Azure OpenAI function calling.

This script demonstrates a conversation with Movivid where:
1. User sends a message
2. Azure OpenAI decides which function to call based on routing logic
3. Functions are executed
4. Results are sent back to GPT
5. GPT generates natural language response
"""

import sys
from pathlib import Path
import os
import asyncio
import json
from dotenv import load_dotenv
from openai import AzureOpenAI

# Add parent directory to path for movivid imports
parent_path = Path(__file__).parent.parent
sys.path.insert(0, str(parent_path))

from movivid import create_movivid

# Load environment variables
load_dotenv()


async def execute_function_call(movivid, function_name: str, arguments: dict):
    """
    Execute a Movivid function by name.
    
    Args:
        movivid: Movivid instance
        function_name: Name of function to call
        arguments: Function arguments as dict
        
    Returns:
        Function result (string or dict)
    """
    func = movivid.get_function_by_name(function_name)
    if func is None:
        return f"Error: Function '{function_name}' not found"
    
    try:
        result = await func(**arguments)
        return result
    except Exception as e:
        return f"Error executing {function_name}: {str(e)}"


async def chat_with_movivid(user_message: str, movivid, client, messages: list):
    """
    Send a message to Movivid and handle function calling.
    
    Args:
        user_message: User's message
        movivid: Movivid instance
        client: Azure OpenAI client
        messages: Conversation history
        
    Returns:
        Assistant's response text
    """
    # Add user message to history
    messages.append({
        "role": "user",
        "content": user_message
    })
    movivid.add_to_history("user", user_message)
    
    print(f"\n{'='*80}")
    print(f"USER: {user_message}")
    print(f"{'='*80}")
    
    # Call GPT with function schemas (using tools API)
    response = client.chat.completions.create(
        model="gpt-5-nano",
        messages=[
            {"role": "system", "content": movivid.instructions},
            *messages
        ],
        tools=movivid.function_schemas,
        tool_choice="auto",
        max_completion_tokens=2000
    )
    
    message = response.choices[0].message
    
    # Check if GPT wants to call a function
    if message.tool_calls:
        tool_call = message.tool_calls[0]
        function_name = tool_call.function.name
        function_args = json.loads(tool_call.function.arguments)
        
        print(f"\n[FUNCTION CALL: {function_name}]")
        print(f"[ARGUMENTS: {function_args}]")
        
        # Execute the function
        function_result = await execute_function_call(movivid, function_name, function_args)
        
        print(f"\n[FUNCTION RESULT (first 200 chars):]")
        result_str = str(function_result)
        print(f"{result_str[:200]}{'...' if len(result_str) > 200 else ''}")
        
        # Add assistant message with tool call
        messages.append({
            "role": "assistant",
            "content": None,
            "tool_calls": [{
                "id": tool_call.id,
                "type": "function",
                "function": {
                    "name": function_name,
                    "arguments": tool_call.function.arguments
                }
            }]
        })
        
        # Add tool response
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": result_str
        })
        
        # WORDALISE functions return final response - use directly
        # Other functions return data - need GPT to synthesize
        is_wordalise = function_name in ['filmsBiggerMeaning', 'whatFilmSaidToMe']
        
        if is_wordalise and result_str and result_str.strip() and not result_str.startswith('{'):
            # Use WORDALISE response directly (already conversational)
            assistant_message = result_str
        else:
            # Let GPT synthesize response from function data
            second_response = client.chat.completions.create(
                model="gpt-5-nano",
                messages=[
                    {"role": "system", "content": movivid.instructions},
                    *messages
                ],
                max_completion_tokens=2000
            )
            
            assistant_message = second_response.choices[0].message.content
    else:
        # No function call, just use the message
        assistant_message = message.content
        messages.append({
            "role": "assistant",
            "content": assistant_message
        })
    
    movivid.add_to_history("assistant", assistant_message)
    
    if not assistant_message or not assistant_message.strip():
        print(f"\n⚠️  WARNING: Empty response from Movivid!")
    
    print(f"\nMOVIVID: {assistant_message if assistant_message else '[EMPTY RESPONSE]'}")
    print(f"{'='*80}\n")
    
    return assistant_message


async def test_conversation():
    """Run a test conversation with Movivid."""
    
    print("🎬 Initializing Movivid Test")
    print("=" * 80)
    
    # Initialize Azure OpenAI
    client = AzureOpenAI(
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        api_version="2025-04-01-preview",
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
    )
    
    # Initialize Movivid
    movivid = create_movivid()
    print(f"✅ Movivid initialized with {len(movivid.functions)} functions")
    print(f"✅ Azure OpenAI client ready (gpt-5-nano)")
    
    # Conversation history
    messages = []
    
    # Test scenarios
    test_queries = [
        "Hi! What is this?",  # Should call howMovividWorks
        "Tell me about The Matrix",  # Should call changeFilm -> filmsBiggerMeaning
        "What did that film say to you personally?",  # Should call whatFilmSaidToMe
        "What about Eternal Sunshine?",  # Should call changeFilm with different film
    ]
    
    print(f"\n{'='*80}")
    print("STARTING CONVERSATION")
    print(f"{'='*80}")
    
    for query in test_queries:
        await chat_with_movivid(query, movivid, client, messages)
        
        # Show context after each turn
        print(f"\n[CONTEXT UPDATE]")
        print(movivid.get_context_summary())
        print()
    
    print(f"\n{'='*80}")
    print("CONVERSATION COMPLETE")
    print(f"{'='*80}")
    print(f"\nTotal turns: {len(movivid.conversation_history)}")
    print(f"Current film: {movivid.current_entities}")
    print(f"User situation: {movivid.user_profile.get('situation', 'Not captured')}")


if __name__ == "__main__":
    asyncio.run(test_conversation())
