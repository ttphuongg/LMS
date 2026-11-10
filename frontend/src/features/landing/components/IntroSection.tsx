import React, { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import bookPhoto from '../assets/intro-book.jpg'

/** Ba mục thông tin, trình bày như các trường trong một phiếu mục lục. */
const FIELDS = [
  {
    id: 'dinh-danh',
    label: 'Định danh',
    text: 'Thư viện công cộng, mở cửa cho mọi người dân không phân biệt tuổi tác hay nghề nghiệp. Học sinh, sinh viên, người đi làm hay người đã nghỉ hưu đều có thể đến đọc, mượn và tra cứu.',
  },
  {
    id: 'su-menh',
    label: 'Sứ mệnh',
    text: 'Hỗ trợ học tập và nghiên cứu, mở rộng cơ hội tiếp cận tri thức cho cộng đồng và nuôi dưỡng thói quen đọc từ nhỏ đến lớn.',
  },
  {
    id: 'gia-tri',
    label: 'Giá trị',
    text: 'Không gian yên tĩnh để tập trung, kho tài liệu từ sách phổ thông đến tài liệu học thuật, cùng cách tra cứu và mượn trả thuận tiện.',
  },
]

export const IntroSection: React.FC = () => {
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)

  // Trên mobile section cao hơn màn hình và xếp dọc: không làm mờ chữ để còn đọc được
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  )
  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  // Khi người dùng bật "giảm chuyển động" chỉ tắt phần trượt, vẫn giữ hiệu ứng mờ.
  const fadeEnabled = !isNarrow

  // Parallax cho ảnh: theo đoạn section đi qua màn hình
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const photoY = useTransform(scrollYProgress, [0, 1], [-24, 24])

  // Cuộn VÀO: 0 khi đỉnh section chạm đáy màn hình, 1 khi chạm đỉnh màn hình
  const { scrollYProgress: enterProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start start'],
  })
  // Cuộn RA: 0 khi đỉnh section chạm đỉnh màn hình, 1 khi đáy section chạm đỉnh màn hình
  const { scrollYProgress: exitProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const enterOpacity = useTransform(enterProgress, [0.1, 0.65], [0, 1])
  const exitOpacity = useTransform(exitProgress, [0, 0.75], [1, 0])
  const contentOpacity = useTransform(
    [enterOpacity, exitOpacity],
    ([e, x]: number[]) => e * x,
  )

  const enterY = useTransform(enterProgress, [0.1, 0.65], [reduce ? 0 : 60, 0])
  const exitY = useTransform(exitProgress, [0, 1], [0, reduce ? 0 : -120])
  const contentY = useTransform([enterY, exitY], ([e, x]: number[]) => e + x)

  return (
    <section
      ref={sectionRef}
      id="gioi-thieu"
      className="intro-section"
      aria-labelledby="intro-heading"
    >
      <div className="intro-photo" aria-hidden="true">
        <motion.img
          src={bookPhoto}
          alt=""
          className="intro-photo-img"
          style={{ y: reduce ? 0 : photoY }}
        />
        <div className="intro-photo-fade" />
      </div>

      <motion.div
        className="intro-inner"
        style={fadeEnabled ? { y: contentY, opacity: contentOpacity } : undefined}
      >
        <h2 id="intro-heading" className="intro-title">
          Thư viện của tất cả mọi người
        </h2>
        <p className="intro-desc">
          Libri là thư viện công cộng, nơi bạn có thể đọc, học và tìm hiểu
          bất cứ điều gì mình quan tâm, theo nhịp của riêng mình.
        </p>

        <dl className="intro-fields">
          {FIELDS.map((f) => (
            <div className="intro-field" key={f.id}>
              <dt>{f.label}</dt>
              <dd>{f.text}</dd>
            </div>
          ))}
        </dl>
      </motion.div>
    </section>
  )
}
