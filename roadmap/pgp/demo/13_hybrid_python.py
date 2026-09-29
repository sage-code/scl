# 13 - Hybrid languages: Python mixes structured, object-oriented, and
# functional style freely in the same file — there is no "pick one" the
# way pure languages like Prolog or Haskell force on you.

# Structured: an ordinary function with a loop and a decision
def classify(score):
    if score >= 90:
        return "A"
    elif score >= 70:
        return "C"
    return "F"

# Object-oriented: a class with encapsulated state and methods
class Student:
    def __init__(self, name, score):
        self.name = name
        self.score = score

    def grade(self):
        return classify(self.score)  # calling the structured function above

# Functional: pure functions, higher-order functions, and a lambda,
# used together with the class defined right above them
students = [Student("Ana", 92), Student("Bob", 74), Student("Cora", 55)]

passing = list(filter(lambda s: s.score >= 70, students))          # functional
names = list(map(lambda s: f"{s.name} ({s.grade()})", passing))    # functional

for line in names:                                                  # structured
    print(line)

# One file, three paradigms, zero friction switching between them —
# that's exactly what "hybrid language" means.
