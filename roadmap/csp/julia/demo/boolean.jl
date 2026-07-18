# Boolean variables
locked = false
closed = true
let
    is_secure  = closed && locked
    println("secure:", is_secure)
    not_secure = !closed || !locked
    if not_secure 
        print("not secure")
    end
end