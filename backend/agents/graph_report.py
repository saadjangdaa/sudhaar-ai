from typing import Literal

from langgraph.graph import END, START, StateGraph

from agents.classifier import classify_issue
from agents.drafter import draft_complaint
from agents.router import route_issue
from schemas.agent_schemas import CivicState


def _after_classify(state: CivicState) -> Literal["route", "needs_clarification"]:
    if state.get("confidence", 1.0) < 0.5:
        return "needs_clarification"
    return "route"


def _mark_needs_clarification(state: CivicState) -> CivicState:
    return {**state, "needs_clarification": True}


def _build_report_graph():
    graph = StateGraph(CivicState)
    graph.add_node("classify", classify_issue)
    graph.add_node("route", route_issue)
    graph.add_node("draft", draft_complaint)
    graph.add_node("needs_clarification", _mark_needs_clarification)

    graph.add_edge(START, "classify")
    graph.add_conditional_edges(
        "classify",
        _after_classify,
        {
            "route": "route",
            "needs_clarification": "needs_clarification",
        },
    )
    graph.add_edge("route", "draft")
    graph.add_edge("draft", END)
    graph.add_edge("needs_clarification", END)
    return graph.compile()


report_graph = _build_report_graph()
