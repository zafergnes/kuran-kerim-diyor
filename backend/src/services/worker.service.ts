import { prisma } from "../utils/prisma";
import { moderateComment } from "./moderation.service";

let isProcessing = false;

export const startModerationWorker = () => {
  console.log("[Worker]: Moderation Worker started. Checking every 30 seconds...");
  
  // Her 30 saniyede bir kontrol et
  setInterval(async () => {
    if (isProcessing) return; // Zaten bir işlem yapılıyorsa bekle
    
    try {
      isProcessing = true;
      
      // En eski 5 adet bekleyen (PENDING) yorumu getir
      const pendingComments = await prisma.comment.findMany({
        where: { 
          status: 'PENDING',
          isDeleted: false,
          moderationReason: null
        },
        orderBy: { createdAt: 'asc' },
        take: 5
      });

      if (pendingComments.length === 0) {
        isProcessing = false;
        return;
      }

      console.log(`[Worker]: Processing ${pendingComments.length} pending comments in order...`);

      for (const comment of pendingComments) {
        try {
          const result = await moderateComment(comment.text);
          console.log(`[Worker]: AI Response for "${comment.text.substring(0, 20)}":`, result);
          
          if (result.reviewRequired) {
            await prisma.comment.update({
              where: { id: comment.id },
              data: { moderationReason: 'AI_UNAVAILABLE', language: result.detectedLanguage || comment.language },
            });
            continue;
          }

          await prisma.comment.update({
            where: { id: comment.id },
            data: { 
              status: result.isSafe ? 'APPROVED' : 'REJECTED',
              moderationReason: result.reason,
              language: result.detectedLanguage || comment.language
            }
          });
          
          // Sayaçları güncelle (AyahStat senkronizasyonu)
          const count = await prisma.comment.count({ 
            where: { ayahId: comment.ayahId, isDeleted: false, status: 'APPROVED' } 
          });
          
          await prisma.ayahStat.upsert({
            where: { ayahId: comment.ayahId },
            update: { commentCount: count },
            create: { ayahId: comment.ayahId, commentCount: count }
          });

        } catch (error: any) {
          if (error?.status === 429) {
            console.warn("[Worker]: Rate limit reached. Stopping this batch.");
            break; // Limite takılırsak bu batch'i durdur, sonraki 30 sn'yi bekle
          }
          console.error(`[Worker]: Error processing comment ${comment.id}:`, error);
        }
      }
    } catch (error) {
      console.error("[Worker]: Fatal error in moderation worker:", error);
    } finally {
      isProcessing = false;
    }
  }, 30000); // 30 saniye
};
