require "js"

xworker = JS::eval("return xworker")

puts "What is 2 + 3?"
puts xworker.sync.input("What is 2 + 3?")
