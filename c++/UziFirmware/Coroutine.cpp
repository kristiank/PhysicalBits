#include "Coroutine.h"

Coroutine::Coroutine(Script* script)
{
	this->script = script;
	activeScript = script;
	framePointer = -1;
	pc = script->getInstructionStart();
	stackElements = 0;
	stackSize = 0;
	nextRun = 0;
	next = 0;
	breakCount = -1;
}

Coroutine::Coroutine()
{
	framePointer = 0;
	pc = 0;
	stackElements = 0;
	stackSize = 0;
	script = activeScript = 0;
	next = 0;
	breakCount = 0;
}

Coroutine::~Coroutine(void)
{
	delete stackElements;
	delete next;
}

Script* Coroutine::getScript(void)
{
	return script;
}


Script* Coroutine::getActiveScript(void)
{
	return activeScript;
}

void Coroutine::setActiveScript(Script* value)
{
	activeScript = value;
}

int16 Coroutine::getFramePointer(void)
{
	return framePointer;
}

void Coroutine::setFramePointer(int16 value)
{
	framePointer = value;
}

int16 Coroutine::getPC(void)
{
	return pc;
}

void Coroutine::setPC(int16 value)
{
	pc = value;
}

void Coroutine::saveStack(StackArray* stack)
{
	delete stackElements;
	stackSize = stack->getPointer();
	stackElements = new float[stackSize];
	for (uint16 i = 0; i < stackSize; i++)
	{
		stackElements[i] = stack->getElementAt(i);
	}
}

void Coroutine::restoreStack(StackArray* stack)
{
	stack->reset();
	for (uint16 i = 0; i < stackSize; i++)
	{
		stack->push(stackElements[i]);
	}
}

Coroutine* Coroutine::getNext(void)
{
	return next;
}

void Coroutine::setNext(Coroutine* value)
{
	next = value;
}

int32 Coroutine::getNextRun(void)
{
	return nextRun;
}

void Coroutine::setNextRun(int32 value)
{
	nextRun = value;
}

int8 Coroutine::getBreakCount(void)
{
	return breakCount;
}

void Coroutine::setBreakCount(int8 value)
{
	breakCount = value;
	dumpState = value == 0;
}

bool Coroutine::getDumpState(void)
{
	return dumpState;
}

void Coroutine::clearDumpState(void)
{
	dumpState = false;
}

uint16 Coroutine::getStackSize(void)
{
	return stackSize;
}

float Coroutine::getStackElementAt(uint16 index)
{
	if (index >= stackSize) return 0;
	return stackElements[index];
}

Error Coroutine::getError(void)
{
	return error;
}

void Coroutine::setError(Error err)
{
	error = err;
}

void Coroutine::reset(void)
{
	error = NO_ERROR;
	activeScript = script;
	framePointer = -1;
	pc = script->getInstructionStart();
	stackSize = 0;
	delete stackElements;
	stackElements = 0;
}