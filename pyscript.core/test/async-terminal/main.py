from overlords import ask_the_overlords

while True:
    prompt = input("Ask the overlords: ")
    if prompt == "bye":
        break

    print("\n" + await ask_the_overlords(prompt) + "\n")


print("\nBye!")
