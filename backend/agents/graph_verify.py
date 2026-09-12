from langgraph.graph import END, START, StateGraph

from agents.verifier import verify_fix
from schemas.agent_schemas import VerificationState


def _build_verify_graph():
    graph = StateGraph(VerificationState)
    graph.add_node("verify", verify_fix)
    graph.add_edge(START, "verify")
    graph.add_edge("verify", END)
    return graph.compile()


verify_graph = _build_verify_graph()
