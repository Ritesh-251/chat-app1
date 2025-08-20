from langchain_community.llms import Ollama

llm = Ollama(model="mistral", base_url="http://localhost:11434")
print(llm.invoke("What is AI?"))
