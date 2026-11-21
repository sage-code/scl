# R data-frame manipulation and linear regression example.
# Uses the built-in `mtcars` dataset with no external packages required.

data(mtcars)

# Subset cars with 6 cylinders and compute mean MPG
six_cyl <- subset(mtcars, cyl == 6)
cat("Mean MPG (6-cyl):", round(mean(six_cyl$mpg), 2), "\n")

# Fit a linear model: miles per gallon as a function of weight (1000 lbs)
fit <- lm(mpg ~ wt, data = mtcars)
print(coef(fit))
