tests
testScriptCallAsCondition
	| cc program script |
	cc := UziCompiler new.
	program := cc compile: '@main [@foo value ifTrue: [D13 toggle]]. @foo [^ 1]'.
	script := program scripts first.
	self assert: script instructions = {
		call arg: #foo.
		jz arg: 2.
		push arg: (program variables detect: [:var | var value = 13]).
		prim arg: (UziPrimitive named: #toggle).
	}