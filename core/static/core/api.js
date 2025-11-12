async function request(url, options = {}) {
    const result = await fetch(url, {
        method: options.method || "GET",
        headers: {
            "X-CSRFToken": csrftoken,
            "Content-Type": "application/x-www-form-urlencoded",
            ...(options.headers || {})
        },
        body: options.body ?? null,
    });

    if (result.status === 204) return null;

    let payload = null;
    const contentType = result.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
        payload = await result.json();
    } else {
        payload = await result.text();
    }

    if (!result.ok) {
        const error = new Error(payload?.error || `HTTP ${result.status}`);
        error.status = result.status;
        error.payload = payload;
        throw error;
    }

    return payload;
}

export const api = {
    setSpeaker(id = "") {
        const url = id ? `/set-speaker/${encodeURIComponent(id)}/` : `/set-speaker/`;
        return request(url, { method: "POST", body: "" });
    },
    deleteSpeaker: (id) => request(`/delete-speaker/${id}/`, { method: "POST", body: "" }),
    updateTime: (id, body) => request(`/update-time/${id}/`, { method: "POST", body }),
    addSpeaker: (body) => request("/add-speaker/", { method: "POST", body }),
};
