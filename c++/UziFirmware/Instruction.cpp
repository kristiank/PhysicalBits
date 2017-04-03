#include "Instruction.h"

Instruction* readInstructions(Reader* rs, uint8 instructionCount, bool& timeout)
{
	Instruction* instructions = new Instruction[instructionCount];
	for (int16 i = 0; i < instructionCount; i++)
	{
		uint8 bytecode = rs->next(timeout);
		if (timeout) break;

		uint8 opcode;
		int16 argument;
		if (bytecode < 0x80)
		{
			/*
			If the high-order bit is zero (< 0x8) then the opcode is stored in the 3 msbits
			and the argument is stored in the 5 lsbits.
			*/
			opcode = bytecode >> 5;
			argument = bytecode & 0x1F;
		}
		else
		{
			/*
			If the high-order bit is one (>= 0x8) then the opcode is stored in the 4 msbits
			and the argument is stored in the 4 lsbits.
			*/
			opcode = bytecode >> 4;
			argument = bytecode & 0xF;
			if (0xF == opcode)
			{
				/*
				Special case: If the 4 msbits happen to be 0xF then the argument is stored
				on the next byte.
				*/
				opcode = bytecode;
				argument = rs->next(timeout);
				if (timeout) break;

				/*
				If the opcode is one of the "jump" instructions, the argument is encoded
				using two's complement.
				*/
				if (opcode >= 0xF0 && opcode <= 0xF7 && argument >= 128)
				{
					argument = (0xFF & ((argument ^ 0xFF) + 1)) * -1;
				}
			}
		}

		// Now we assign the actual opcode and argument
		switch (opcode)
		{
			case 0x00: instructions[i].opcode = TURN_ON; break;
			case 0x01: instructions[i].opcode = TURN_OFF; break;
			case 0x02: instructions[i].opcode = WRITE_PIN; break;
			case 0x03: instructions[i].opcode = READ_PIN; break;

			case 0xF0: instructions[i].opcode = JMP; break;
			case 0xF1: instructions[i].opcode = JZ; break;
			case 0xF2: instructions[i].opcode = JNZ; break;
			case 0xF3: instructions[i].opcode = JNE; break;
			case 0xF4: instructions[i].opcode = JLT; break;
			case 0xF5: instructions[i].opcode = JLTE; break;
			case 0xF6: instructions[i].opcode = JGT; break;
			case 0xF7: instructions[i].opcode = JGTE; break;
				
			case 0xFF:
			{
				instructions[i].opcode = argument >> 7 ? WRITE_LOCAL : READ_LOCAL;
				argument = argument & 0x7F;
			}
			break;

			case 0xF8:
			case 0x08:
				instructions[i].opcode = READ_GLOBAL;
				break;

			case 0xF9:
			case 0x09:
				instructions[i].opcode = WRITE_GLOBAL;
				break;

			case 0xFB: argument += 256; // 288 -> 543
			case 0xFA: argument += 16;  // 32 -> 287
			case 0x0B: argument += 16;  // 16 -> 31
			case 0x0A:					// 0 -> 15
			{
				instructions[i].opcode = PRIM_CALL;
			}
			break;

			case 0xFC:
			case 0x0C:
				instructions[i].opcode = SCRIPT_CALL;
				break;

			case 0xFD:
			case 0x0D:
				instructions[i].opcode = SCRIPT_START;
				break;

			case 0xFE:
			case 0x0E:
				instructions[i].opcode = SCRIPT_STOP;
				break;

		}
		instructions[i].argument = argument;
	}
	return instructions;
}