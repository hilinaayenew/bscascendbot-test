# Research Mode Bot Building

This document captures the research-oriented approach for Vivid Insights bot development. The goal is to build strong prototypes and a repeatable design process, not to deploy production systems yet.

## Objective

- Focus on bot creation rather than deployment.
- Build prototypes for the next phase of the project.
- Develop a robust process for quickly producing narrow, specialist bots.
- Use Claude agents and the existing Vivid Insights methodology as design collaborators.

## Why this matters

Vivid Insights can differentiate by creating a reliable method for producing bots that:

- speak deeply about a narrow specialist domain
- often work with data and education
- stay consistent and expert in a well-defined scope
- are easier to iterate and refine quickly

This is a research-first strategy: validate the architecture, voice, and data flow before worrying about deployment.

## Research Mode Principles

1. Build small, focused prototypes.
2. Avoid deployment work unless it supports experimentation.
3. Document assumptions, learnings, and fallback plans.
4. Use Claude agents as collaborators for design, not only execution.
5. Keep each bot narrowly scoped and data-aware.

## Focus Areas

### 1. Prototype bots for the next stage

- Select two or three candidate domains.
- Define each bot's narrow remit and target user problem.
- Build a minimal conversational prototype for each domain.
- Validate the prototype with examples and peer review.

### 2. Create a repeatable bot design process

- Define a lightweight workflow for new bot creation.
- Capture the process in reusable templates and docs.
- Use existing `vivid-creator` methodology as the base.
- Add a Claude-powered design loop for rapid iteration.

## Suggested Research Workflow

1. **Domain brief**
   - Define the bot's niche and audience.
   - Identify the domain's key data sources.
   - Set the bot's tone and persona.

2. **Architecture scout**
   - Choose whether the bot is data-first, narrative-first, or hybrid.
   - Map the data flow: Data API, catalog, internet enrichment.
   - Decide the core function set (6-12 functions).

3. **Prototype implementation**
   - Build a minimal converser class using the framework.
   - Create one or two sample functions and data wrappers.
   - Train initial CSV examples for the bot's voice.
   - Run a few test conversations.

4. **Design process with Claude agents**
   - Use Claude agents to help define system prompts.
   - Use Claude to generate sample training examples.
   - Use Claude to review bot responses and suggest improvements.
   - Maintain a design log of prompts, decisions, and revisions.

5. **Review and refine**
   - Evaluate the bot against narrow domain accuracy.
   - Check that the bot stays on-topic and avoids hallucination.
   - Refine the prompt, functions, and training examples.

6. **Repeat quickly**
   - Use the same process for the next bot.
   - Reuse templates from the first prototype.
   - Capture what worked and what didn’t.

## Rapid Bot Creation Setup

Use the existing Vivid Insights framework as the starting point:

- `.github/instructions/building_conversers_overview.instructions.md`
- `.github/instructions/building_conversers_functions.instructions.md`
- `.github/instructions/building_conversers_implementation.instructions.md`
- `.github/instructions/building_conversers_system_prompt.instructions.md`
- `.github/instructions/building_conversers_wordalisations.instructions.md`
- `examples/movivid/` as an implementation example

### Quick start for a new research bot

1. Copy the Movivid example structure.
2. Define the bot domain and persona.
3. Create a small data wrapper or catalog.
4. Write 2-3 initial CSV examples.
5. Run a test conversation.
6. Iterate with Claude and the design workflow.

## Outcome Goals

- A prototype bot that is easy to iterate.
- A documented process that can be reused for new bots.
- A clear separation between research/prototyping and production.
- A set of artifacts for each bot: domain brief, prompt template, function plan, training examples.

## Notes

- This document is intentionally lightweight and research-focused.
- It is not a deployment checklist.
- It is meant to support quick experimentation and iterative bot design.
