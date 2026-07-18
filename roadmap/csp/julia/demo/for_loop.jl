for i = 1:10
    if i % 3 != 0
        continue
    end
    print(i)
    print(" ")
end
# expected: 3 6 9

print("\n")
for j in 1:1000
    print(j)
    print(" ")
    if j == 5
        break
    end
end
# expected: 1 2 3 4 5