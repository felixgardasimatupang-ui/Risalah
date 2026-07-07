from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest, ChatResponse, IndexRequest
from app.services.rag_engine import RAGEngineService
from app.services.llm_client import ask_llm_stream

router = APIRouter()
rag_service = RAGEngineService()


@router.post("/ask", response_model=ChatResponse)
async def ask_question(request: ChatRequest):
    return await rag_service.answer(request)


@router.post("/ask/stream")
async def ask_question_stream(request: ChatRequest):
    async def event_stream():
        yield "event: meta\ndata: " + '{"model":"' + request.model + '"}' + "\n\n"

        context = ""
        if rag_service.vector_store and request.meeting_ids:
            try:
                docs = rag_service.vector_store.similarity_search_with_score(
                    request.message,
                    k=request.top_k,
                    filter={"meeting_id": {"$in": request.meeting_ids}} if request.meeting_ids else None,
                )
                context = "\n\n".join([
                    f"[{doc.metadata.get('source', 'Unknown')}] {doc.page_content}"
                    for doc, _ in docs
                ])
                citations = [
                    {"source": doc.metadata.get("source", "Unknown"), "text": doc.page_content, "score": float(score)}
                    for doc, score in docs
                ]
                if citations:
                    yield "event: citations\ndata: " + __import__("json").dumps(citations) + "\n\n"
            except Exception:
                pass

        async for token in ask_llm_stream(request.message, context, model_key=request.model):
            yield f"event: token\ndata: {__import__('json').dumps({'token': token})}\n\n"

        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/index")
async def index_meeting(request: IndexRequest):
    return rag_service.index_meeting(request)


@router.delete("/index/{meeting_id}")
async def delete_index(meeting_id: str):
    return rag_service.delete_index(meeting_id)
