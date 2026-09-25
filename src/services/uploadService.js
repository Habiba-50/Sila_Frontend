import axios from "axios";

// The pre-signed S3 URL is returned by the backend already signed — it must
// be called with a bare axios/fetch PUT, no Authorization header and no
// baseURL, or the signature will be invalid.
export function uploadFileToS3(presignedUrl, file) {
  return axios.put(presignedUrl, file, {
    headers: { "Content-Type": file.type },
  });
}
