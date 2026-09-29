{ 03 - Structured programming: Pascal, designed by Niklaus Wirth in 1970
  specifically to teach structured programming's three block shapes:
  decision, repetition, and selection. }
program GradeReport;
var
  score: Integer;
  grade: Char;
  i: Integer;

begin
  score := 74;

  { Decision }
  if score >= 90 then
    grade := 'A'
  else if score >= 80 then
    grade := 'B'
  else if score >= 70 then
    grade := 'C'
  else
    grade := 'F';

  Writeln('Score ', score, ' -> Grade ', grade);

  { Repetition }
  for i := 1 to 3 do
    Writeln('Pass ', i, ' of 3');

  { Selection }
  case grade of
    'A': Writeln('Excellent');
    'B': Writeln('Good');
    'C': Writeln('Passing');
  else
    Writeln('Needs improvement');
  end;
end.
