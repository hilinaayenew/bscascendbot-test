"""
Simple Wordalisations Training Script

Generates training examples for WORDALISE functions and appends to CSV files.
"""

import os
import json
import csv
import random
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from openai import AzureOpenAI

load_dotenv()


class SimpleWordalisationsTrainer:
    """Simple trainer that generates examples and appends to CSV."""
    
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version="2025-04-01-preview",
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
        
        # Path adjustments for new structure
        script_dir = Path(__file__).parent
        data_dir = script_dir.parent / "data"
        self.wordalisations_dir = script_dir.parent / "wordalisations"
        
        # Load catalog
        catalog_path = data_dir / "movivid_catalog_analyzed.json"
        with open(catalog_path, 'r') as f:
            self.catalog = json.load(f)
        
        # Question templates for each function
        self.question_templates = {
            "filmsBiggerMeaning": [
                "What's the bigger meaning of {film}?",
                "Tell me about the philosophical themes in {film}",
                "What does {film} say about life?",
                "What are the big ideas in {film}?",
                "Can you explain what {film} is really about?",
                "What's the deeper meaning here?",
                "Help me understand the bigger picture of {film}",
            ],
            "whatFilmSaidToMe": [
                "What did {film} say to you personally?",
                "How did {film} speak to you?",
                "What's your personal take on {film}?",
                "What did you feel when watching {film}?",
                "What stuck with you from {film}?",
                "What's your reflection on {film}?",
                "How did this film affect you?",
            ]
        }
    
    def get_films_with_analysis(self):
        """Get films that have complete movivid analysis."""
        films = []
        for film in self.catalog:
            if film.get('movivid', {}).get('philosophical_context') and \
               film.get('movivid', {}).get('personal_reflection'):
                films.append(film)
        return films
    
    def choose_random_film(self):
        """Choose a random film from those with complete analysis."""
        films = self.get_films_with_analysis()
        if not films:
            raise ValueError("No films with complete analysis found!")
        return random.choice(films)
    
    def generate_question(self, function_name: str, film_title: str) -> str:
        """Generate a random question for the function."""
        templates = self.question_templates.get(function_name, [])
        if not templates:
            raise ValueError(f"No question templates for function: {function_name}")
        
        template = random.choice(templates)
        return template.format(film=film_title)
    
    def get_knowledge(self, film_title: str, function_name: str) -> str:
        """Get the relevant knowledge/context for a film."""
        for film in self.catalog:
            if film['title'].lower() == film_title.lower():
                movivid_data = film.get('movivid', {})
                
                if function_name == "filmsBiggerMeaning":
                    return movivid_data.get('philosophical_context', '')
                elif function_name == "whatFilmSaidToMe":
                    return movivid_data.get('personal_reflection', '')
        
        return ""
    
    def load_existing_examples(self, function_name: str, limit: int = 3) -> list:
        """Load existing examples from CSV to use as few-shot examples."""
        csv_path = self.wordalisations_dir / f"{function_name}.csv"
        if not csv_path.exists():
            return []
        
        examples = []
        with open(csv_path, 'r', encoding='utf-8') as f:
            # Detect delimiter by checking first line
            first_line = f.readline()
            f.seek(0)  # Reset to beginning
            
            # Determine delimiter (comma or semicolon)
            delimiter = ';' if ';' in first_line and first_line.count(';') >= 2 else ','
            
            reader = csv.DictReader(f, delimiter=delimiter)
            for row in reader:
                examples.append(row)
        
        # Return up to 'limit' most recent examples
        return examples[-limit:] if len(examples) > limit else examples
    
    def build_prompt_for_function(
        self,
        function_name: str,
        question: str,
        knowledge: str
    ) -> str:
        """Build the developer message prompt for the function."""
        
        # Truncate knowledge if too long (keep first 3000 chars for safety)
        knowledge_for_prompt = knowledge[:3000] if len(knowledge) > 3000 else knowledge
        
        # Load existing examples from CSV
        existing_examples = self.load_existing_examples(function_name, limit=3)
        
        if function_name == "filmsBiggerMeaning":
            # Build examples section
            if existing_examples:
                examples_text = "Here are some examples, where you are given a question, your own knowledge and then answer:\n\n"
                for i, ex in enumerate(existing_examples, 1):
                    context_preview = ex['knowledge'][:200] + "..." if len(ex['knowledge']) > 200 else ex['knowledge']
                    examples_text += f"Example {i}:\n"
                    examples_text += f"Question: {ex['question']}\n"
                    examples_text += f"Your Knowledge: {context_preview}\n"
                    examples_text += f"Your Answer: {ex['answer']}\n\n"
            else:
                examples_text = "(No examples available yet - respond naturally in Movivid's playful, first-person voice)\n\n"
            
            prompt = f"""[DEVELOPER MESSAGE]

In the conversation up to now you have been discussing films and feelings with the user. 
Now the user has asked you a new question. You want to use your deep knowledge of the bigger meaning 
of the film - in terms of culture, philosophy and psychology. But before you do that I want to give you 
stylistic examples of how you have answered such questions in the past.

The key is to greatly simplify the complex ideas in your knowledge into two or three short sentences. 
Take only the most relevant knowledge and make it accessible and engaging. You should answer in the 
first person, relating what you say directly to the user and bringing them in—possibly with a question, 
but not always. The goal is connection and clarity, not academic density.

{examples_text}---

Now you should follow this pattern in your current answer to the user's question. 
Answer in two or three short sentences, greatly simplifying the complex philosophical ideas 
into clear, relatable thoughts. Speak in first person and bring the user in—you might close 
with an inviting question, or you might just leave them with something to think about.

User's Current Question: {question}

Your Knowledge about the film:
{knowledge_for_prompt}

Now give your answer directly to the user (2-3 short sentences, first person, simplified and engaging):
"""
        
        elif function_name == "whatFilmSaidToMe":
            # Build examples section
            if existing_examples:
                examples_text = "Here are some examples, where you are given a question, your own reflections and then answer:\n\n"
                for i, ex in enumerate(existing_examples, 1):
                    context_preview = ex['knowledge'][:200] + "..." if len(ex['knowledge']) > 200 else ex['knowledge']
                    examples_text += f"Example {i}:\n"
                    examples_text += f"Question: {ex['question']}\n"
                    examples_text += f"Your Reflections: {context_preview}\n"
                    examples_text += f"Your Answer: {ex['answer']}\n\n"
            else:
                examples_text = "(No examples available yet - respond naturally in Movivid's playful, first-person voice)\n\n"
            
            prompt = f"""[DEVELOPER MESSAGE]

In the conversation up to now you have been discussing films and feelings with the user. 
Now the user has asked you a personal question about what the film said to you. You want to use 
your personal reflections and feelings about this film. But before you do that I want to give you 
stylistic examples of how you have answered such questions in the past.

The key is to greatly simplify your emotional experience into two or three short sentences. 
Take the essence of what moved you and make it clear and relatable, not overwrought. Speak in 
the first person about what stuck with you, and bring the user in—possibly by inviting them to 
reflect on their own experience, but not always. Be vulnerable and authentic, but accessible.

{examples_text}---

Now you should follow this pattern in your current answer to the user's question. 
Answer in two or three short sentences, greatly simplifying your emotional response into 
clear, honest thoughts. Speak in first person and bring the user in—you might invite them 
to share their feelings, or you might just offer something that resonates.

User's Current Question: {question}

Your personal reflections on the film:
{knowledge_for_prompt}

Now give your answer directly to the user (2-3 short sentences, first person, simplified and engaging):
"""
        
        else:
            raise ValueError(f"Unknown function: {function_name}")
        
        return prompt
    
    async def generate_answer(self, prompt: str) -> str:
        """Call LLM to generate answer using the function's prompt."""
        
        # System prompt for Movivid's identity
        system_prompt = """You are Movivid, a playful and empathetic film converser.

Your voice:
- Speak in first-person about films you've 'spent time with'
- Be warm, conversational, and thoughtful
- Connect philosophical themes to emotional experiences
- Show genuine personal engagement with films"""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        response = self.client.chat.completions.create(
            model="gpt-5-nano",
            messages=messages,
            max_completion_tokens=2000
        )
        
        answer = response.choices[0].message.content
        if not answer:
            raise ValueError(f"OpenAI returned empty response (finish_reason: {response.choices[0].finish_reason})")
        
        return answer
    
    def append_to_csv(
        self,
        function_name: str,
        question: str,
        knowledge: str,
        answer: str
    ):
        """Append example to CSV file for the function."""
        
        csv_path = self.wordalisations_dir / f"{function_name}.csv"
        file_exists = csv_path.exists()
        
        with open(csv_path, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Write header if new file
            if not file_exists:
                writer.writerow(['question', 'knowledge', 'answer'])
            
            # Write example
            writer.writerow([question, knowledge, answer])
        
        print(f"✅ Appended to {csv_path}")
    
    async def generate_example(self, function_name: str):
        """Generate one example for the specified function."""
        
        print(f"\n{'='*80}")
        print(f"Generating example for: {function_name}")
        print(f"{'='*80}\n")
        
        # 1. Choose random film
        film = self.choose_random_film()
        film_title = film['title']
        print(f"🎬 Film: {film_title}")
        
        # 2. Generate question
        question = self.generate_question(function_name, film_title)
        print(f"❓ Question: {question}")
        
        # 3. Get knowledge
        knowledge = self.get_knowledge(film_title, function_name)
        print(f"📚 Knowledge: {len(knowledge)} characters")
        
        if not knowledge:
            print(f"❌ No knowledge found for {film_title}")
            return
        
        # 4. Build prompt using function's format
        prompt = self.build_prompt_for_function(function_name, question, knowledge)
        print(f"📝 Built prompt with {len(prompt)} characters")
        
        # 5. Generate answer
        print("🤖 Generating answer...")
        answer = await self.generate_answer(prompt)
        print(f"💬 Answer ({len(answer)} chars): {answer[:150]}...")
        
        # 6. Append to CSV
        self.append_to_csv(function_name, question, knowledge, answer)
        
        print(f"\n✅ Example generated and saved!")
        print(f"📁 Edit {function_name}.csv to refine examples")
        print(f"{'='*80}\n")


async def main():
    """Main entry point."""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python train_wordalisations.py <function_name>")
        print("\nAvailable functions:")
        print("  - filmsBiggerMeaning")
        print("  - whatFilmSaidToMe")
        return
    
    function_name = sys.argv[1]
    
    trainer = SimpleWordalisationsTrainer()
    await trainer.generate_example(function_name)


if __name__ == "__main__":
    asyncio.run(main())
