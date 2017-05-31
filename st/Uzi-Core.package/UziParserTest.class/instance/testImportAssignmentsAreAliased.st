tests
testImportAssignmentsAreAliased
	| ast foo pp src |
	pp := UziParser new librariesDirectory: (FileDirectory on: 'D:\UAI\GIRA\Uzi\uzi\tests').
	src := 'import a = ''test4.uzi''
		@main ticking [D13 toggle]'.
	ast := pp parse: src.
	foo := ast scripts detect: [:s | s name = 'a@foo'].
	self assert: 'a@var' equals: foo body statements first left name