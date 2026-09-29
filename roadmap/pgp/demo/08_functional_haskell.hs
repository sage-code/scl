-- 08 - Functional programming: Haskell, a purely functional language —
-- every function is pure, data is immutable by default, and evaluation
-- is lazy (an expression isn't computed until its value is actually needed).

square :: Int -> Int
square x = x * x

-- A higher-order function: takes a function as its first argument
applyTwice :: (a -> a) -> a -> a
applyTwice f x = f (f x)

-- A pure, recursive function — no loops, no mutable variables
factorial :: Integer -> Integer
factorial n
  | n <= 1    = 1
  | otherwise = n * factorial (n - 1)

main :: IO ()
main = do
  print (applyTwice square 3)          -- square(square(3)) = 81
  print (factorial 5)                  -- 120
  print (map (* 2) [1, 2, 3, 4, 5])    -- [2,4,6,8,10]
